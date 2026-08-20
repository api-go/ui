/**
 * Modal Component Module
 */
globalThis.Component.register('Modal', container => {
	const dialog = container.querySelector('.modal-dialog')
	const body = container.querySelector('.modal-body')
	if (container.hasAttribute('width')) dialog.style.width = container.getAttribute('width')
	if (container.hasAttribute('max-width')) dialog.style.maxWidth = container.getAttribute('max-width')
	if (container.hasAttribute('body-height')) body.style.height = container.getAttribute('body-height')
	if (container.hasAttribute('body-min-height')) body.style.minHeight = container.getAttribute('body-min-height')
        const staticDismiss = container.getAttribute('data-bs-backdrop') === 'static' || container.hasAttribute('static')
        container.guardDirty = container.hasAttribute('guard-dirty')
        container.dirty = false
        container._forceClose = false
	container._returnFocus = null
        container.modal = new bootstrap.Modal(container, { backdrop: staticDismiss ? 'static' : true, keyboard: !staticDismiss })
	const handleGlobalEscape = event => {
		if (event.key !== 'Escape' || staticDismiss || !container.classList.contains('show') || container.contains(document.activeElement)) return
		const openModals = [...document.querySelectorAll('.modal.show')]
		if (openModals.at(-1) !== container) return
		event.preventDefault()
		container.modal.hide()
	}
        container.addEventListener('bind', e => {
                e.detail ? container.modal.show() : container.modal.hide()
        })
	container.addEventListener('show.bs.modal', event => {
		const active = event.relatedTarget || document.activeElement
		container._returnFocus = active && active !== document.body && !container.contains(active) ? active : null
		container.inert = false
	})
        container.addEventListener('hide.bs.modal', event => {
                if (container.guardDirty && container.dirty && !container._forceClose) {
                        event.preventDefault()
                        container.dispatchEvent(new CustomEvent('dismissblocked', { bubbles: false }))
			return
                }
		if (container.contains(document.activeElement)) document.activeElement.blur()
		container.inert = true
        })
	container.addEventListener('shown.bs.modal', () => {
		container.dirty = false
		document.addEventListener('keydown', handleGlobalEscape, true)
	})
        container.addEventListener('hidden.bs.modal', () => {
		document.removeEventListener('keydown', handleGlobalEscape, true)
		if (container._returnFocus?.isConnected && !container._returnFocus.closest?.('[inert]')) container._returnFocus.focus({ preventScroll: true })
		container._returnFocus = null
                container._forceClose = false
                container.dispatchEvent(new CustomEvent('change', { bubbles: false, detail: false }))
        })
        const markDirty = event => {
                if (container.guardDirty && event.target?.matches?.('input,select,textarea,[contenteditable="true"]') && !event.target.hasAttribute('data-no-dirty')) container.dirty = true
        }
        container.addEventListener('input', markDirty)
        container.addEventListener('change', markDirty)
        // Dialog is a native HTML element whose show/hide methods would otherwise shadow Bootstrap's methods.
        container.show = (...args) => container.modal.show(...args)
        container.hide = (force = false) => { container._forceClose = force; container.modal.hide() }
}, globalThis.Util.makeDom(/*html*/`
<div class="modal fade">
  <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
    <div $class="modal-content bg-body text-body border-\${this.state?.type || 'primary'} border-2 shadow-lg">
      <div slot-id="header" class="modal-header py-2 px-3 bg-body-tertiary d-flex align-items-center">
        <h6 $class="modal-title fw-bold me-auto text-\${this.state?.type || 'primary'}" $text="this.state?.title"></h6>
        <button type="button" class="btn btn-link ms-2 bi bi-x-lg link-reset p-0" style="color:inherit; text-decoration:none" data-bs-dismiss="modal"></button>
      </div>
      <div slot-id="body" class="modal-body p-3"></div>
      <div slot-id="footer" class="modal-footer py-2 px-3 bg-body-tertiary"></div>
    </div>
  </div>
</div>
`), globalThis.Util.makeDom(/*html*/`
<style>
  Modal .modal-footer:empty { display: none; }
  Modal .modal-footer .btn { --bs-btn-padding-y: .25rem; --bs-btn-padding-x: .5rem; --bs-btn-font-size: .875rem; --bs-btn-border-radius: var(--bs-border-radius-sm); }
</style>
`))
