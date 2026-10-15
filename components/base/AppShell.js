/** Application viewport; navigation remains mounted when collapsed. */
Component.register('AppShell', container => {
  container.state.navOpen ??= false
  container.toggleNavigation = () => { container.state.navOpen = !container.state.navOpen }
  container.state.hasNavigation = !!container.querySelector('[data-shell-navigation]').children.length
  const measure = () => { container.state.narrow = container.clientWidth < 768 }
  const observer = new ResizeObserver(measure)
  observer.observe(container)
  DOMDisposer.add(container, () => observer.disconnect())
  measure()
  container.addEventListener('keydown', event => {
    if (event.key === 'Escape' && container.state.navOpen) {
      container.state.navOpen = false
      container.querySelector('[data-shell-toggle]').focus()
    }
  })
}, Util.makeDom(`
<div class="d-flex flex-column bg-body text-body overflow-hidden" $class="this.state.narrow?'shell-narrow':''" style="min-width:0;min-height:0;flex:1 1 0%">
  <header class="d-flex align-items-center border-bottom flex-shrink-0">
    <button type="button" data-shell-toggle class="btn btn-link text-body m-1" $.hidden="!this.state.narrow || !this.state.hasNavigation" aria-label="Toggle navigation" $aria-expanded="this.state.navOpen?'true':'false'" $onclick="this.toggleNavigation()"><i class="bi bi-list" aria-hidden="true"></i></button>
    <div slot-id="header" data-shell-header class="d-flex flex-wrap align-items-center flex-fill"></div>
  </header>
  <div class="d-flex flex-fill overflow-hidden" style="min-width:0;min-height:0">
    <div slot-id="navigation" role="navigation" aria-label="Application" data-shell-navigation class="flex-shrink-0 border-end overflow-auto" $class="this.state.navOpen?'shell-navigation-open':''"></div>
    <main slot-id="content" data-shell-content class="d-flex flex-column flex-fill overflow-hidden" style="min-width:0;min-height:0"></main>
  </div>
</div>`), Util.makeDom(`
<style>
  AppShell > header > [data-shell-header] { gap:var(--ui-gap,.5rem);padding:var(--ui-tool-space,.5rem); }
  AppShell[viewport] { height:100dvh; }
  AppShell > header > [data-shell-toggle][hidden] { display:none !important; }
  AppShell > div > [data-shell-navigation] { width:var(--ui-navigation-width,14rem); }
  AppShell > div > [data-shell-navigation]:empty { display:none; }
  AppShell [data-shell-content] > :only-child { flex:1 1 0%; min-width:0; min-height:0; }
  AppShell.shell-narrow > div { position:relative; }
    AppShell.shell-narrow > div > [data-shell-navigation] { display:none; position:absolute; inset:0 auto 0 0; z-index:1020; width:min(var(--ui-navigation-width,14rem),85%); background:var(--bs-body-bg); box-shadow:var(--bs-box-shadow); }
    AppShell.shell-narrow > div > [data-shell-navigation].shell-navigation-open { display:block; }
</style>`))
