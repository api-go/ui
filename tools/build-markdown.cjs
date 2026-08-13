const { join } = require('node:path')
const { rollup } = require('rollup')
const commonjs = require('@rollup/plugin-commonjs')
const { nodeResolve } = require('@rollup/plugin-node-resolve')

const root = join(__dirname, '..')
const source = `
import MarkdownIt from 'markdown-it'
import taskLists from 'markdown-it-task-lists'
import DOMPurify from 'dompurify'

const instances = new Map()
const boolean = value => value === true || value === '' || value === 'true'
const optionsKey = options => JSON.stringify({
  allowHtml: boolean(options.allowHtml),
  breaks: boolean(options.breaks),
  linkify: options.linkify !== false
})
const parserFor = options => {
  const key = optionsKey(options)
  if (!instances.has(key)) {
    const settings = JSON.parse(key)
    instances.set(key, new MarkdownIt({
      html: settings.allowHtml,
      breaks: settings.breaks,
      linkify: settings.linkify,
      typographer: false
    }).use(taskLists, { enabled: false, label: true, labelAfter: true }))
  }
  return instances.get(key)
}
const render = (source, options = {}) => DOMPurify.sanitize(
  parserFor(options).render(String(source ?? '')),
  { USE_PROFILES: { html: true } }
)

globalThis.Markdown = { render }
`

const virtual = {
  name: 'virtual-markdown-entry',
  resolveId(id) { return id === 'virtual:entry' ? id : null },
  load(id) { return id === 'virtual:entry' ? source : null }
}

const buildMarkdown = async () => {
  const build = await rollup({
    input: 'virtual:entry',
    plugins: [virtual, nodeResolve({ browser: true }), commonjs()],
    onwarn(warning, warn) { if (warning.code !== 'CIRCULAR_DEPENDENCY') warn(warning) }
  })
  await build.write({
    file: join(root, 'libraries', 'Markdown.js'),
    format: 'iife',
    generatedCode: 'es2015'
  })
  await build.close()
}

module.exports = { buildMarkdown }
