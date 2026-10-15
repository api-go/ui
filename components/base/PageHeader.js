/** Page hierarchy without owning application actions. */
Component.register('PageHeader', container => {
  container.state.title ??= container.getAttribute('heading') || ''
  container.state.description ??= ''
}, Util.makeDom(`
<header class="d-flex flex-wrap align-items-center justify-content-between">
  <div style="min-width:0;flex:1 1 12rem">
    <h1 class="h4 mb-0 text-break" $text="this.state.title"></h1>
    <p class="text-body-secondary mt-1 mb-0" $if="this.state.description" $text="this.state.description"></p>
  </div>
  <div slot-id="actions" data-page-actions class="d-flex flex-wrap align-items-center"></div>
</header>`), Util.makeDom(`<style>PageHeader { gap:var(--ui-section-gap,1.5rem); } PageHeader > [data-page-actions] { gap:var(--ui-gap,.5rem); }</style>`))
