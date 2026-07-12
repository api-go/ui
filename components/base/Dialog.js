/**
 * Dialog Component Module
 */
globalThis.Component.register('Dialog', globalThis.Component.getSetupFunction('Modal'), globalThis.Util.makeDom(/*html*/`
<div class="modal fade" data-bs-backdrop="static">
  <div class="modal-dialog modal-dialog-centered">
    <div $class="modal-content border-\${this.state?.type || 'primary'} border-2 shadow-lg">
      <template $if="this.state?.title">
        <div $class="modal-header py-2 px-3 bg-light fw-bold text-\${this.state?.type || 'primary'}" $text="this.state?.title"></div>
      </template>
      <div class="modal-body p-4 text-center">
        <div $text="this.state?.message" class="fs-5 text-secondary"></div>
      </div>
      <div class="modal-footer py-2 px-3 bg-light border-0 d-flex justify-content-center gap-3">
        <template $each="this.state?.buttons">
        <button type="button" $class="btn btn-\${this.state?.type} px-4" $onclick="this.result=index+1; this.hide()" $text="item"></button>
        </template>
      </div>
    </div>
  </div>
</div>
`))
,
globalThis.Util.makeDom(/*html*/`
<style>
  Dialog.modal { background: transparent; border: 0; padding: 0; }
</style>
`)

let _dialogCount = 0
globalThis.Dialog = {
show({ title = '', message = '', buttons = ['{#Close#}'], type = 'body' }) {
        const d = document.body.appendChild(document.createElement('Dialog'))
        d.style.zIndex = 2000 + ++_dialogCount
        Promise.resolve().then(() => {
                Object.assign(d.state, { message, title, type, buttons })
                d.show()
        })
        return new Promise((resolve) => {
                d.addEventListener('change', e => {
                        _dialogCount--
                        resolve(d.result || 0)
                        d.remove()
                })
        })
},
alert(message, options = {}) {
        return this.show({ message, ...options })
},
confirm(message, options = {}) {
        return new Promise(resolve => this.show({ message, buttons: ['{#Cancel#}', '{#Confirm#}'], ...options }).then(index => resolve(index >= 2)).catch(() => resolve(false)))
}
}
