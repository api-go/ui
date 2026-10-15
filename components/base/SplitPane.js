/** Resizable master/detail workspace; mobile shows one retained pane at a time. */
Component.register('SplitPane', container => {
  const number = (name, fallback) => {
    const value = Number(container.getAttribute(name))
    return container.hasAttribute(name) && Number.isFinite(value) && value > 0 ? value : fallback
  }
  const min = number('min', 160), max = Math.max(min, number('max', 560)), mainMin = number('main-min', 240)
  container.state.width ??= 280
  container.state.pane ??= 'sidebar'
  container.state.narrow = false
  const sidebar = container.querySelector('[data-split-sidebar]')
  const resizer = container.querySelector('Resizer')
  resizer.target = sidebar
  resizer.setAttribute('min', String(min))
  const layout = () => {
    const available = container.clientWidth
    container.state.narrow = available < Math.max(768, min + mainMin + 9)
    const limit = Math.max(min, Math.min(max, available - mainMin - 9))
    resizer.setAttribute('max', String(limit))
    const requested = Number(container.state.width)
    sidebar.style.width = `${Math.max(min, Math.min(limit, Number.isFinite(requested) ? requested : 280))}px`
  }
  container.show = pane => {
    if (!['sidebar', 'main'].includes(pane)) throw new Error('SplitPane.show: expected sidebar or main')
    container.state.pane = pane
    container.dispatchEvent(new CustomEvent('panechange', { detail: pane }))
  }
  container.addEventListener('bind', event => {
    if (Number.isFinite(event.detail) && event.detail > 0) container.state.width = event.detail
  })
  resizer.addEventListener('change', event => {
    container.state.width = event.detail
    container.dispatchEvent(new CustomEvent('change', { detail: event.detail }))
  })
  const stop = container.state.__watch('width', layout)
  const observer = new ResizeObserver(layout)
  observer.observe(container)
  DOMDisposer.add(container, () => { observer.disconnect(); stop() })
  layout()
}, Util.makeDom(`
<div class="d-flex flex-column overflow-hidden" $class="this.state.narrow?'split-narrow':''" style="flex:1 1 0%;min-width:0;min-height:0">
  <div class="split-tools d-flex border-bottom flex-shrink-0" $if="this.state.narrow">
    <button type="button" class="btn btn-outline-secondary" $aria-pressed="this.state.pane==='sidebar'?'true':'false'" $onclick="this.show('sidebar')">Browse</button>
    <button type="button" class="btn btn-outline-secondary" $aria-pressed="this.state.pane==='main'?'true':'false'" $onclick="this.show('main')">Detail</button>
  </div>
  <div class="d-flex flex-fill overflow-hidden" style="min-width:0;min-height:0">
    <aside slot-id="sidebar" data-split-sidebar class="d-flex flex-column flex-shrink-0 overflow-hidden" style="min-width:0;min-height:0" $.hidden="this.state.narrow && this.state.pane==='main'"></aside>
    <Resizer aria-label="Resize sidebar" $.hidden="this.state.narrow"></Resizer>
    <section slot-id="main" data-split-main class="d-flex flex-column flex-fill overflow-hidden" style="min-width:0;min-height:0" $.hidden="this.state.narrow && this.state.pane!=='main'"></section>
  </div>
</div>`), Util.makeDom(`
<style>
  SplitPane > .split-tools { gap:var(--ui-gap,.5rem);padding:var(--ui-tool-space,.5rem); }
  SplitPane > div > [hidden] { display:none !important; }
  SplitPane > div > [data-split-sidebar] > :only-child, SplitPane > div > [data-split-main] > :only-child { flex:1 1 0%; min-width:0; min-height:0; }
  SplitPane.split-narrow > div > [data-split-sidebar] { width:100% !important; }
</style>`))
