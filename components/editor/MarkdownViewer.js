/**
 * Lightweight, sanitized Markdown document renderer.
 */
globalThis.Component.register('MarkdownViewer', container => {
  const content = container.querySelector('.markdown-viewer-content')
  let value = container.getAttribute('value') || ''

  const options = () => ({
    allowHtml: container.hasAttribute('allowhtml'),
    breaks: container.hasAttribute('breaks')
  })
  const render = () => {
    const html = globalThis.Markdown.render(value, options())
    content.innerHTML = html
    const target = container.getAttribute('linktarget')
    if (target) content.querySelectorAll('a[href]').forEach(link => {
      link.target = target
      if (target === '_blank') link.rel = 'noopener noreferrer'
    })
    container.dispatchEvent(new CustomEvent('render', { detail: { source: value, html }, bubbles: false }))
    return html
  }
  const updateValue = next => {
    value = String(next ?? '')
    render()
  }

  Object.defineProperty(container, 'value', {
    configurable: true,
    get: () => value,
    set: updateValue
  })
  container.render = render
  container.getHTML = () => content.innerHTML
  container.addEventListener('bind', event => { container.value = event.detail })

  const observer = new MutationObserver(mutations => {
    if (mutations.some(mutation => mutation.attributeName === 'value')) value = container.getAttribute('value') || ''
    render()
  })
  observer.observe(container, { attributes: true, attributeFilter: ['value', 'allowhtml', 'breaks', 'linktarget'] })
  render()
  globalThis.DOMDisposer.add(container, () => observer.disconnect())
}, globalThis.Util.makeDom(/*html*/`<div class="markdown-viewer-root"><div class="markdown-viewer-content"></div></div>`), globalThis.Util.makeDom(/*html*/`<style>
  MarkdownViewer { display:block; color:var(--bs-body-color); overflow-wrap:anywhere; }
  MarkdownViewer .markdown-viewer-content > :first-child { margin-top:0; }
  MarkdownViewer .markdown-viewer-content > :last-child { margin-bottom:0; }
  MarkdownViewer h1, MarkdownViewer h2 { padding-bottom:.3em; border-bottom:1px solid var(--bs-border-color); }
  MarkdownViewer h1 { font-size:2em; } MarkdownViewer h2 { font-size:1.5em; } MarkdownViewer h3 { font-size:1.25em; }
  MarkdownViewer h4, MarkdownViewer h5, MarkdownViewer h6 { font-size:1em; }
  MarkdownViewer h1, MarkdownViewer h2, MarkdownViewer h3, MarkdownViewer h4, MarkdownViewer h5, MarkdownViewer h6 { margin:1.25em 0 .6em; font-weight:600; line-height:1.25; }
  MarkdownViewer p, MarkdownViewer ul, MarkdownViewer ol, MarkdownViewer blockquote, MarkdownViewer pre, MarkdownViewer table { margin:0 0 1em; }
  MarkdownViewer blockquote { padding:0 1em; color:var(--bs-secondary-color); border-left:.25em solid var(--bs-border-color); }
  MarkdownViewer code { padding:.15em .35em; border-radius:.25rem; background:var(--bs-tertiary-bg); font-family:var(--bs-font-monospace); font-size:.875em; }
  MarkdownViewer pre { padding:1em; overflow:auto; border-radius:var(--bs-border-radius); background:var(--bs-tertiary-bg); }
  MarkdownViewer pre code { padding:0; background:transparent; font-size:.875rem; }
  MarkdownViewer table { display:block; width:max-content; max-width:100%; overflow:auto; border-collapse:collapse; }
  MarkdownViewer th, MarkdownViewer td { padding:.4em .75em; border:1px solid var(--bs-border-color); }
  MarkdownViewer tr:nth-child(2n) { background:var(--bs-tertiary-bg); }
  MarkdownViewer img { max-width:100%; height:auto; }
  MarkdownViewer .contains-task-list { padding-left:1.5em; list-style:none; }
  MarkdownViewer .task-list-item input { margin:0 .5em 0 -1.5em; }
</style>`))
