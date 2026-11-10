const { copyFile, readdir, readFile, stat, writeFile } = require('node:fs/promises');
const { join, relative, sep } = require('node:path');
const terser = require('terser');
const { validateDocs } = require('./validate-docs.cjs');
const { buildCodeMirror } = require('./build-codemirror.cjs');
const { buildMarkdown } = require('./build-markdown.cjs');

const root = join(__dirname, '..');
const publicDirs = ['frameworks', 'libraries', 'utilities', 'components'];

const frameworks = {
  Bootstrap: join(root, '..', 'bootstrap', 'dist', 'bootstrap.js'),
  State: join(root, '..', 'state', 'dist', 'state.js')
};

const filesBelow = async directory => {
  const entries = await readdir(directory, { withFileTypes: true });
  const results = await Promise.all(entries.map(entry => {
    const file = join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(file) : Promise.resolve(entry.name.endsWith('.js') && !entry.name.endsWith('.min.js') ? [file] : []);
  }));
  return results.flat();
};

const translationTexts = source => {
  const texts = [];
  for (const match of source.matchAll(/\{#([\s\S]*?)#\}/g)) {
    const text = match[1].split('||', 1)[0].trim();
    if (text && !text.includes('\n')) texts.push(text);
  }
  for (const match of source.matchAll(/\bGetLang\s*\(\s*(['"`])((?:\\.|(?!\1)[\s\S])*)\1/g)) {
    if (match[1] === '`' && match[2].includes('${')) continue;
    const text = match[2]
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\(['"`\\])/g, '$1')
      .trim();
    if (text && !text.includes('\n')) texts.push(text);
  }
  return texts;
};

(async () => {
  const packageMetadata = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  const llmsFile = join(root, 'llms.txt');
  const llmsSource = await readFile(llmsFile, 'utf8');
  const versionLine = /^Version: \S+$/m;
  const cdnVersion = /(@api-go\/ui@)[^/"\s]+(?=\/ui(?:\.min)?\.js)/g;
  if (!versionLine.test(llmsSource) || !cdnVersion.test(llmsSource)) throw new Error('llms.txt version markers are missing');
  cdnVersion.lastIndex = 0;
  const builtLlms = llmsSource
    .replace(versionLine, `Version: ${packageMetadata.version}`)
    .replace(cdnVersion, `$1${packageMetadata.version}`);
  await writeFile(llmsFile, builtLlms);
  await validateDocs();

  await Promise.all([buildCodeMirror(), buildMarkdown()]);
  if (process.argv.includes('--sync-frameworks')) await Promise.all(Object.entries(frameworks).map(([name, source]) => copyFile(source, join(root, 'frameworks', `${name}.js`))));
  const sources = (await Promise.all(publicDirs.map(dir => filesBelow(join(root, dir))))).flat();
  // libraries contains generated third-party bundles whose encoded data can
  // accidentally contain marker-shaped byte sequences.
  const translationSources = sources.filter(file => !relative(root, file).startsWith(`libraries${sep}`));
  const sourceContents = await Promise.all(translationSources.map(file => readFile(file, 'utf8')));
  const languages = [...new Set(sourceContents.flatMap(translationTexts))].sort();
  await writeFile(join(root, 'lang.txt'), languages.length ? `${languages.join('\n')}\n` : '');
  const sourceStats = await Promise.all(sources.map(async file => {
    const path = relative(root, file).split(sep).join('/');
    return [path, Math.floor((await stat(file)).mtimeMs)];
  }));
  const sourceVersions = Object.fromEntries(sourceStats.map(([path, modified]) => [path, modified.toString(36)]));
  const buildVersion = Math.max(...sourceStats.map(([, modified]) => modified)).toString(36);
  const uiFile = join(root, 'ui.js');
  const uiSource = await readFile(uiFile, 'utf8');
  const builtUi = uiSource.replace(
    /const build = \{ version: '[^']*', files: \{[^\n]*\} \};/,
    `const build = { version: '${buildVersion}', files: ${JSON.stringify(sourceVersions)} };`
  );
  if (builtUi === uiSource && !uiSource.includes('const build =')) throw new Error('ui.js build manifest is missing');
  await writeFile(uiFile, builtUi);

  const minify = async file => {
    const output = await terser.minify(await readFile(file, 'utf8'), { compress: true, mangle: true, format: { comments: false } });
    if (output.error) throw output.error;
    await writeFile(file.replace(/\.js$/, '.min.js'), output.code + '\n');
  };
  await Promise.all([...sources, uiFile].map(minify));

  console.log(`Built @api-go/ui (${sources.length} module files; cache ${buildVersion})`);
})();
