const { copyFile, readdir, readFile, stat, writeFile } = require('node:fs/promises');
const { join, relative, sep } = require('node:path');
const terser = require('terser');

const root = join(__dirname, '..');
const publicDirs = ['frameworks', 'utilities', 'components'];

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

(async () => {
  await Promise.all(Object.entries(frameworks).map(([name, source]) => copyFile(source, join(root, 'frameworks', `${name}.js`))));
  const sources = (await Promise.all(publicDirs.map(dir => filesBelow(join(root, dir))))).flat();
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

  console.log(`Built @apigo.cc/ui (${sources.length} module files; cache ${buildVersion})`);
})();
