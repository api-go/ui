const { join } = require('node:path')
const { rollup } = require('rollup')
const { nodeResolve } = require('@rollup/plugin-node-resolve')

const root = join(__dirname, '..')
const sharedGlobals = {
  '@codemirror/autocomplete': '__CodeMirrorModules.autocomplete',
  '@codemirror/language': '__CodeMirrorModules.language',
  '@codemirror/lint': '__CodeMirrorModules.lint',
  '@codemirror/state': '__CodeMirrorModules.state',
  '@codemirror/view': '__CodeMirrorModules.view',
  '@lezer/common': '__CodeMirrorModules.lezerCommon',
  '@lezer/highlight': '__CodeMirrorModules.lezerHighlight',
  '@lezer/lr': '__CodeMirrorModules.lezerLR'
}

const coreSource = `
import { minimalSetup } from 'codemirror'
import * as autocomplete from '@codemirror/autocomplete'
import * as commands from '@codemirror/commands'
import * as language from '@codemirror/language'
import * as lint from '@codemirror/lint'
import * as state from '@codemirror/state'
import * as view from '@codemirror/view'
import { oneDark } from '@codemirror/theme-one-dark'
import * as lezerCommon from '@lezer/common'
import * as lezerHighlight from '@lezer/highlight'
import * as lezerLR from '@lezer/lr'

const sourceScript = document.currentScript
const sourceUrl = new URL(sourceScript.src)
const minified = /CodeMirror\\.min\\.js$/.test(sourceUrl.pathname)
const languages = new Map()
const loading = new Map()
const names = {
  plain: 'plain', text: 'plain', txt: 'plain',
  js: 'javascript', javascript: 'javascript', mjs: 'javascript', cjs: 'javascript',
  ts: 'typescript', typescript: 'typescript', tsx: 'typescript',
  json: 'json', yaml: 'yaml', yml: 'yaml', py: 'python', python: 'python',
  html: 'html', htm: 'html', xml: 'xml', css: 'css', sql: 'sql', mysql: 'sql', pgsql: 'sql', postgres: 'sql',
  c: 'cpp', h: 'cpp', cc: 'cpp', cpp: 'cpp', cxx: 'cpp', java: 'java', rs: 'rust', rust: 'rust', go: 'go',
  sh: 'shell', bash: 'shell', shell: 'shell', md: 'markdown', markdown: 'markdown'
}
const files = {
  plain: 'CodeMirrorPlain', javascript: 'CodeMirrorJavaScript', typescript: 'CodeMirrorTypeScript', json: 'CodeMirrorJSON', yaml: 'CodeMirrorYAML',
  python: 'CodeMirrorPython', html: 'CodeMirrorHTML', xml: 'CodeMirrorXML', css: 'CodeMirrorCSS', sql: 'CodeMirrorSQL',
  cpp: 'CodeMirrorCPP', java: 'CodeMirrorJava', rust: 'CodeMirrorRust', go: 'CodeMirrorGo', shell: 'CodeMirrorShell', markdown: 'CodeMirrorMarkdown'
}
const normalizeLanguage = value => names[String(value || '').toLowerCase().replace(/^\\./, '')] || ''
const languageFromPath = path => {
  const filename = String(path || '').split(/[?#]/, 1)[0]
  const dot = filename.lastIndexOf('.')
  return dot < 0 ? '' : normalizeLanguage(filename.slice(dot + 1))
}
const resolveLanguage = ({ lang = '', path = '' } = {}) => normalizeLanguage(lang) || languageFromPath(path) || 'plain'
const registerLanguage = (name, factory) => languages.set(normalizeLanguage(name) || name, factory)
const loadLanguage = name => {
  name = normalizeLanguage(name) || 'plain'
  if (languages.has(name)) return Promise.resolve(languages.get(name))
  if (loading.has(name)) return loading.get(name)
  const filename = files[name]
  if (!filename) return Promise.reject(new Error('Unsupported CodeEditor language: ' + name))
  const loadScript = globalThis.__ApigoUIRuntime?.loadAsset
    ? globalThis.__ApigoUIRuntime.loadAsset('libraries/' + filename + '.js')
    : new Promise((resolve, reject) => {
    const script = document.createElement('script')
    const url = new URL(filename + (minified ? '.min.js' : '.js'), sourceUrl)
    url.search = sourceUrl.search
    script.src = url.href
    script.onload = () => languages.has(name) ? resolve(languages.get(name)) : reject(new Error('CodeEditor language did not register: ' + name))
    script.onerror = () => reject(new Error('Failed to load CodeEditor language: ' + name))
    document.head.appendChild(script)
  })
  const task = loadScript.then(() => languages.has(name)
    ? languages.get(name)
    : Promise.reject(new Error('CodeEditor language did not register: ' + name)))
    .catch(error => { loading.delete(name); throw error })
  loading.set(name, task)
  return task
}

globalThis.__CodeMirrorModules = { autocomplete, language, lint, state, view, lezerCommon, lezerHighlight, lezerLR }
globalThis.CodeMirror = {
  setup: [minimalSetup, view.lineNumbers(), view.highlightActiveLineGutter(), language.bracketMatching()],
  oneDark,
  EditorState: state.EditorState,
  Compartment: state.Compartment,
  EditorView: view.EditorView,
  keymap: view.keymap,
  placeholder: view.placeholder,
  indentWithTab: commands.indentWithTab,
  syntaxTree: language.syntaxTree,
  ensureSyntaxTree: language.ensureSyntaxTree,
  indentRange: language.indentRange,
  linter: lint.linter,
  lintGutter: lint.lintGutter,
  diagnosticCount: lint.diagnosticCount,
  normalizeLanguage,
  languageFromPath,
  resolveLanguage,
  registerLanguage,
  loadLanguage,
  getLanguage: name => languages.get(normalizeLanguage(name)) || null
}
`

const languageEntries = {
  CodeMirrorPlain: `globalThis.CodeMirror.registerLanguage('plain', () => [])`,
  CodeMirrorJavaScript: `import { javascript } from '@codemirror/lang-javascript'; globalThis.CodeMirror.registerLanguage('javascript', () => javascript())`,
  CodeMirrorTypeScript: `import { javascript } from '@codemirror/lang-javascript'; globalThis.CodeMirror.registerLanguage('typescript', () => javascript({ typescript: true }))`,
  CodeMirrorJSON: `import { json } from '@codemirror/lang-json'; globalThis.CodeMirror.registerLanguage('json', () => json())`,
  CodeMirrorYAML: `import { yaml } from '@codemirror/lang-yaml'; globalThis.CodeMirror.registerLanguage('yaml', () => yaml())`,
  CodeMirrorPython: `import { python } from '@codemirror/lang-python'; globalThis.CodeMirror.registerLanguage('python', () => python())`,
  CodeMirrorHTML: `import { html } from '@codemirror/lang-html'; globalThis.CodeMirror.registerLanguage('html', () => html())`,
  CodeMirrorXML: `import { xml } from '@codemirror/lang-xml'; globalThis.CodeMirror.registerLanguage('xml', () => xml())`,
  CodeMirrorCSS: `import { css } from '@codemirror/lang-css'; globalThis.CodeMirror.registerLanguage('css', () => css())`,
  CodeMirrorSQL: `import { sql } from '@codemirror/lang-sql'; globalThis.CodeMirror.registerLanguage('sql', () => sql().language)`,
  CodeMirrorCPP: `import { cpp } from '@codemirror/lang-cpp'; globalThis.CodeMirror.registerLanguage('cpp', () => cpp())`,
  CodeMirrorJava: `import { java } from '@codemirror/lang-java'; globalThis.CodeMirror.registerLanguage('java', () => java())`,
  CodeMirrorRust: `import { rust } from '@codemirror/lang-rust'; globalThis.CodeMirror.registerLanguage('rust', () => rust())`,
  CodeMirrorGo: `import { go } from '@codemirror/lang-go'; globalThis.CodeMirror.registerLanguage('go', () => go())`,
  CodeMirrorShell: `import { StreamLanguage } from '@codemirror/language'; import { shell } from '@codemirror/legacy-modes/mode/shell'; globalThis.CodeMirror.registerLanguage('shell', () => StreamLanguage.define(shell))`,
  CodeMirrorMarkdown: `import { markdownLanguage } from '@codemirror/lang-markdown'; globalThis.CodeMirror.registerLanguage('markdown', () => markdownLanguage)`
}

const virtual = source => ({
  name: 'virtual-codemirror-entry',
  resolveId(id) { return id === 'virtual:entry' ? id : null },
  load(id) { return id === 'virtual:entry' ? source : null }
})

const bundle = async ({ source, name, external = [] }) => {
  const build = await rollup({
    input: 'virtual:entry',
    external,
    plugins: [virtual(source), nodeResolve({ browser: true })],
    onwarn(warning, warn) { if (warning.code !== 'CIRCULAR_DEPENDENCY') warn(warning) }
  })
  await build.write({
    file: join(root, 'libraries', `${name}.js`),
    format: 'iife',
    globals: sharedGlobals,
    generatedCode: 'es2015'
  })
  await build.close()
}

const buildCodeMirror = async () => {
  await bundle({ source: coreSource, name: 'CodeMirror' })
  await Promise.all(Object.entries(languageEntries).map(([name, source]) => bundle({
    source,
    name,
    external: Object.keys(sharedGlobals)
  })))
}

module.exports = { buildCodeMirror }
