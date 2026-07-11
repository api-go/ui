/**
 * Toast Component
 */
globalThis.Component.register('Toast', container => {
        container.toast = new bootstrap.Toast(container, { autohide: container.state.delay > 0 })
        globalThis.Util.copyFunction(container, container.toast, 'show', 'hide')
        container.addEventListener('show.bs.toast', () => {
                if (container.state.delay > 0) {
                        let timer
                        const startTimer = () => {
                                container.state.left = container.state.delay / 1000
                                timer = setInterval(() => {
                                        if (!container.isConnected || --container.state.left <= 0) clearInterval(timer)
                                }, 1000)
                        }
                        startTimer()
                        container.addEventListener('mouseenter', () => { clearInterval(timer); container.state.left = undefined })
                        container.addEventListener('mouseleave', startTimer)
                }
        })
}, globalThis.Util.makeDom(/*html*/`
<div class="toast align-items-center border-0 m-1">
  <div $class="toast-body rounded p-3 text-bg-\${this.state?.type}">
    <div class="d-flex align-items-center">
      <div class="flex-grow-1">
        <span style="white-space:pre-wrap" class="fs-6" $text="this.state?.message"></span>
        <template $if="this.state?.left !== undefined"><span class="small text-dim ms-2" $text="\${this.state?.left}s"></span></template>
      </div>
      <button type="button" class="btn btn-link ms-3 bi bi-x-lg link-reset" style="color:inherit" data-bs-dismiss="toast"></button>
    </div>
    <div class="d-flex justify-content-end gap-3"><template $each="this.state?.buttons || ['{#Close#}']"><button type="button" $class="btn btn-sm btn-\${this.state?.type} mt-2" data-bs-dismiss="toast" $onclick="this.result=index+1" $text="item"></button></template></div>
  </div>
</div>
`), globalThis.Util.makeDom(/*html*/`<div toast-container="default" class="position-fixed bottom-0 end-0 overflow-auto" style="z-index:3000;max-height:80%"></div>`))

globalThis.Toast = {
        show(message, options = {}) {
                const delay = options.delay ?? 5000
                const toast = document.createElement('Toast')
                toast.state = { delay, left: delay ? delay / 1000 : undefined, type: options.type || 'primary', message, buttons: options.buttons ?? ['{#Close#}'] }
                globalThis.$(`[toast-container="${options.container || 'default'}"]`).appendChild(toast)
                return Promise.resolve().then(() => { toast.show(); return toast })
        },
        confirm(message, options = {}) {
                return new Promise(resolve => this.show(message, { buttons: ['{#Confirm#}'], ...options }).then(toast => {
                        toast.addEventListener('hidden.bs.toast', () => resolve(toast.result === 1), { once: true })
                }).catch(() => resolve(false)))
        }
}
