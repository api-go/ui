/**
 * Modal Component Module
 */
globalThis.Component.register('Modal', container => {
        container.modal = new bootstrap.Modal(container)
        container.addEventListener('bind', e => {
                e.detail ? container.modal.show() : container.modal.hide()
        })
        container.addEventListener('hide.bs.modal', () => {
                document.activeElement?.blur()
                container.dispatchEvent(new CustomEvent('change', { bubbles: false, detail: false }))
        })
        // Dialog is a native HTML element whose show/hide methods would otherwise shadow Bootstrap's methods.
        container.show = (...args) => container.modal.show(...args)
        container.hide = (...args) => container.modal.hide(...args)
}, globalThis.Util.makeDom(/*html*/`
<div class="modal fade" data-bs-backdrop="static">
  <div class="modal-dialog modal-dialog-centered">
    <div $class="modal-content border-\${this.state?.type || 'primary'} border-2 shadow-lg">
      <div slot-id="header" class="modal-header py-2 px-3 bg-light">
        <h6 $class="modal-title fw-bold text-\${this.state?.type || 'primary'}" $text="this.state?.title"></h6>
        <button type="button" class="btn btn-link ms-2 bi bi-x-lg link-reset p-0" style="color:inherit; text-decoration:none" data-bs-dismiss="modal"></button>
      </div>
      <div slot-id="body" class="modal-body p-3"></div>
      <div slot-id="footer" class="modal-footer py-2 px-3 bg-light"></div>
    </div>
  </div>
</div>
`))
