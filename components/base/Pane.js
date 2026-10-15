/** A bounded region. The content receiver owns scrolling unless scroll="none". */
Component.register('Pane', container => {
  const scroll = container.getAttribute('scroll') || 'auto'
  if (!['auto', 'none'].includes(scroll)) throw new Error('Pane: scroll must be auto or none')
}, Util.makeDom(`
<section class="d-flex flex-column bg-body text-body overflow-hidden" style="flex:1 1 0%;min-height:0;min-width:0">
  <header slot-id="header" data-pane-header class="flex-shrink-0 border-bottom"></header>
  <div slot-id="toolbar" data-pane-toolbar class="flex-shrink-0 border-bottom"></div>
  <div slot-id="content" data-pane-content class="d-flex flex-column flex-grow-1" style="min-height:0;min-width:0"></div>
  <footer slot-id="footer" data-pane-footer class="flex-shrink-0 border-top"></footer>
</section>`), Util.makeDom(`
<style>
  Pane > [data-pane-header] { padding:var(--ui-region-space,1rem); }
  Pane > [data-pane-toolbar], Pane > [data-pane-footer] { padding:var(--ui-tool-space,.5rem); }
  Pane > [data-pane-header]:empty, Pane > [data-pane-toolbar]:empty, Pane > [data-pane-footer]:empty { display:none; }
  Pane > [data-pane-content] { overflow:auto; }
  Pane[scroll="none"] > [data-pane-content] { overflow:hidden; }
  Pane > [data-pane-content] > :only-child { flex:1 1 auto; min-height:0; min-width:0; }
</style>`))
