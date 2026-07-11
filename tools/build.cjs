const { execFileSync } = require('node:child_process');
const { readdir, readFile, stat, writeFile } = require('node:fs/promises');
const { join, relative, sep } = require('node:path');
const terser = require('terser');

const root = join(__dirname, '..');
const publicDirs = ['frameworks', 'utilities', 'components'];

const version = () => {
  const tags = execFileSync('git', ['tag', '--sort=-v:refname'], { cwd: root, encoding: 'utf8' })
    .trim().split(/\s+/).filter(tag => /^v\d+\.\d+\.\d+$/.test(tag));
  if (!tags.length) return '1.0.0';
  const [major, minor, patch] = tags[0].slice(1).split('.').map(Number);
  return `${major}.${minor}.${patch + 1}`;
};

const filesBelow = async directory => {
  const entries = await readdir(directory, { withFileTypes: true });
  const results = await Promise.all(entries.map(entry => {
    const file = join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(file) : Promise.resolve(entry.name.endsWith('.js') && !entry.name.endsWith('.min.js') ? [file] : []);
  }));
  return results.flat();
};

const setVersion = (text, nextVersion) => text
  .replace(/"version": "\d+\.\d+\.\d+"/, `"version": "${nextVersion}"`)
  .replace(/@apigo\.cc\/ui@\d+\.\d+\.\d+/g, `@apigo.cc/ui@${nextVersion}`);

(async () => {
  const nextVersion = version();
  const sources = (await Promise.all(publicDirs.map(dir => filesBelow(join(root, dir))))).flat();
  const sourceVersions = Object.fromEntries(await Promise.all(sources.map(async file => {
    const path = relative(root, file).split(sep).join('/');
    return [path, Math.floor((await stat(file)).mtimeMs).toString(36)];
  })));
  const uiFile = join(root, 'ui.js');
  const uiSource = await readFile(uiFile, 'utf8');
  const builtUi = uiSource.replace(
    /const build = \{ version: '[^']*', files: \{[^\n]*\} \};/,
    `const build = { version: '${nextVersion}', files: ${JSON.stringify(sourceVersions)} };`
  );
  if (builtUi === uiSource && !uiSource.includes('const build =')) throw new Error('ui.js build manifest is missing');
  await writeFile(uiFile, builtUi);

  const minify = async file => {
    const output = await terser.minify(await readFile(file, 'utf8'), { compress: true, mangle: true, format: { comments: false } });
    if (output.error) throw output.error;
    await writeFile(file.replace(/\.js$/, '.min.js'), output.code + '\n');
  };
  await Promise.all([...sources, uiFile].map(minify));

  for (const name of ['package.json', 'README.md', 'README.zh-CN.md', 'AI.yaml']) {
    const file = join(root, name);
    await writeFile(file, setVersion(await readFile(file, 'utf8'), nextVersion));
  }
  console.log(`Built @apigo.cc/ui@${nextVersion} (${sources.length} module files)`);
})();
