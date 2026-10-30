/** Internal template shared by Drawer and ActionSheet, loaded before components. */
globalThis.DrawerFrame = (body='', footer='') => Util.makeDom(`
<div class="drawer-host d-block">
 <div data-drawer-surface class="offcanvas bg-body text-body" tabindex="-1">
  <div class="offcanvas-header border-bottom gap-2 px-3 py-2 flex-shrink-0"><h2 data-drawer-title class="offcanvas-title h5 mb-0 text-break flex-fill" $text="this.state.title"></h2><button type="button" class="btn btn-link text-body-secondary d-inline-flex align-items-center justify-content-center" aria-label="{#Close drawer#}" $onclick="this.cancel('close')"><i class="bi bi-x-lg" aria-hidden="true"></i></button></div>
  <div slot-id="body" class="drawer-body d-flex flex-column flex-fill overflow-auto" $class="this.bodyclass">${body}</div>
  <div slot-id="footer" class="drawer-footer ui-toolbar px-3 border-top d-flex flex-wrap align-items-center gap-2 flex-shrink-0">${footer}</div>
 </div>
</div>`);
