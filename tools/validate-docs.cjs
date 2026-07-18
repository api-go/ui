const { access, readFile, readdir } = require('node:fs/promises');
const { basename, dirname, join, relative, resolve, sep } = require('node:path');

const root = join(__dirname, '..');
const publicDirs = ['frameworks', 'utilities', 'components'];
const posixPath = file => relative(root, file).split(sep).join('/');

const filesBelow = async directory => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(entry => {
    const file = join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(file) : [file];
  }));
  return files.flat();
};

const sectionItems = (source, section) => {
  const lines = source.split('\n');
  const start = lines.findIndex(line => line === `${section}:`);
  if (start < 0) return [];
  const items = [];
  for (const line of lines.slice(start + 1)) {
    const match = line.match(/^  - (.+)$/);
    if (!match) break;
    items.push(match[1]);
  }
  return items;
};

const validateDocs = async () => {
  const errors = [];
  const [packageMetadata, llms, uiSource] = await Promise.all([
    readFile(join(root, 'package.json'), 'utf8').then(JSON.parse),
    readFile(join(root, 'llms.txt'), 'utf8'),
    readFile(join(root, 'ui.js'), 'utf8')
  ]);

  const localLinks = [...llms.matchAll(/\]\(([^)]+)\)/g)]
    .map(match => match[1])
    .filter(link => !/^[a-z]+:/i.test(link));
  for (const link of localLinks) {
    const file = resolve(root, link.split(/[?#]/, 1)[0]);
    try { await access(file); } catch (_) { errors.push(`llms.txt links to missing file: ${link}`); }
  }

  const documentedComponents = new Map(
    localLinks
      .filter(link => /^components\/.+\.yaml$/.test(link))
      .map(link => [basename(link, '.yaml'), link])
  );
  const modulesBlock = uiSource.match(/const modules = \{([\s\S]*?)\n  \};/)?.[1] || '';
  const implementedComponents = new Map(
    [...modulesBlock.matchAll(/^    (\w+): \{ path: '(components\/.+)\.js'/gm)]
      .map(match => [match[1], `${match[2]}.yaml`])
  );
  for (const [name, file] of documentedComponents) {
    if (implementedComponents.get(name) !== file) errors.push(`llms.txt documents component not registered by ui.js: ${name}`);
  }
  for (const [name, file] of implementedComponents) {
    if (documentedComponents.get(name) !== file) errors.push(`ui.js registers component missing from llms.txt: ${name}`);
  }

  const yamlFiles = (await Promise.all(publicDirs.map(dir => filesBelow(join(root, dir)))))
    .flat()
    .filter(file => file.endsWith('.yaml'));
  for (const file of yamlFiles) {
    const source = await readFile(file, 'utf8');
    const path = posixPath(file);
    const name = source.match(/^name: (.+)$/m)?.[1];
    if (!name) errors.push(`${path} is missing name`);
    if (name && basename(file, '.yaml') !== name) errors.push(`${path} name must match its basename`);
    if (!/^purpose: .+$/m.test(source)) errors.push(`${path} is missing purpose`);
    if (!/^examples:/m.test(source)) errors.push(`${path} is missing examples`);
    if (/^(example|property):/m.test(source)) errors.push(`${path} must use plural examples/properties`);

    for (const section of ['related', 'tests']) {
      for (const item of sectionItems(source, section)) {
        if (/^[a-z]+:\/\//i.test(item)) continue;
        const target = resolve(dirname(file), item);
        try { await access(target); } catch (_) { errors.push(`${path} ${section} points to missing file: ${item}`); }
      }
    }
  }

  const versions = [...llms.matchAll(/@apigo\.cc\/ui@([^/`"\s]+)/g)].map(match => match[1]);
  if (!versions.length || versions.some(version => version !== packageMetadata.version)) {
    errors.push(`llms.txt CDN versions must all equal package.json version ${packageMetadata.version}`);
  }

  if (errors.length) throw new Error(`AI documentation validation failed:\n- ${errors.join('\n- ')}`);
  console.log(`Validated AI documentation (${localLinks.length} links; ${yamlFiles.length} YAML files; ${documentedComponents.size} components)`);
};

if (require.main === module) validateDocs().catch(error => { console.error(error); process.exit(1); });

module.exports = { validateDocs };
