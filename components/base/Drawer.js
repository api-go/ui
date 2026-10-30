/** One physical Bootstrap overlay at a time. Suspended drawers retain DOM/drafts. */
(() => {
  const stack = []
  let active = null, running = false, returnFocus = null
  const escape = event => {
    const top = stack.at(-1)
    if (!top || top.static || event.key !== 'Escape' || event.isComposing) return
    if (top.panel.contains(event.target) && top.panel.classList.contains('show') && !top.panel.classList.contains('showing')) return
    event.preventDefault(); event.stopPropagation(); top.cancel('escape')
  }
  const settle = entry => {
    const index = stack.indexOf(entry); if (index < 0) return
    stack.splice(index, 1)
    const result = entry.result || {reason: 'cancel'}
    entry.settle(result)
    if (!stack.length) document.removeEventListener('keydown', escape, true)
    if (entry.opener?.isConnected && !entry.opener.closest('[inert]')) returnFocus = entry.opener
  }
  const drain = async () => {
    if (running) return
    running = true
    try {
      while (true) {
        for (const entry of [...stack]) if (!entry.open && entry !== active) settle(entry)
        const next = stack.at(-1)
        if (active && active !== next || active && !active.open) {
          const current = active
          await current.hidePhysical(); active = null
          if (!current.open) settle(current)
          continue
        }
        if (!active && next?.ready && next.open) {
          active = next; await next.showPhysical(); continue
        }
        break
      }
    } finally {
      running = false
      if (!stack.length && returnFocus?.isConnected && !returnFocus.closest('[inert]')) returnFocus.focus({preventScroll: true})
      returnFocus = null
    }
  }
  Component.register('Drawer', container => {
    const panel = container.querySelector('[data-drawer-surface]')
    const originalPlacement = container.getAttribute('placement') || 'end'
    if (!['start','end','top','bottom'].includes(originalPlacement)) throw Error('Drawer: invalid placement')
    const entry = {open: false, ready: false, static: container.hasAttribute('static'), result: null, opener: null}
    const adaptive = !container.hasAttribute('noadaptive'), media = matchMedia('(max-width:575.98px)')
    container.state.open = false
    container.state.title ??= container.getAttribute('title') || '{#Details#}'
    container.state.phase = 'closed'
    container.bodyclass = container.getAttribute('body-class') || 'p-3'
    if (container.hasAttribute('width')) panel.style.setProperty('--bs-offcanvas-width',container.getAttribute('width'))
    if (container.hasAttribute('height')) panel.style.setProperty('--bs-offcanvas-height',container.getAttribute('height'))
    let removed = false, instance, resolve, promise, focusBeforeSuspend, internalHide = false, cycle = false
    const ancestors = []; for (let node = container; node; node = node.parentElement) ancestors.push(node)
    const appearance = () => {
      const density = ancestors.find(node => ['ui-sm','ui-lg','ui-default'].some(name => node.classList.contains(name)))
      for (const name of ['ui-sm','ui-lg','ui-default']) panel.classList.toggle(name, !!density?.classList.contains(name))
      panel.classList.toggle('ui-link', ancestors.some(node => node.classList.contains('ui-link')))
      const theme = ancestors.find(node => node.hasAttribute('data-bs-theme'))?.getAttribute('data-bs-theme')
      if (theme) panel.setAttribute('data-bs-theme', theme); else panel.removeAttribute('data-bs-theme')
    }
    const layout = () => {
      if (panel.matches('.showing,.hiding')) return
      const placement = adaptive && media.matches && ['start','end'].includes(originalPlacement) ? 'bottom' : originalPlacement
      for (const side of ['start','end','top','bottom']) panel.classList.toggle('offcanvas-'+side, side === placement)
    }
    panel.id ||= 'drawer-surface-'+UUID.make()
    const heading = panel.querySelector('[data-drawer-title]')
    heading.id = panel.id+'-title'; panel.setAttribute('aria-labelledby', heading.id)
    const observer = new MutationObserver(appearance)
    for (const node of ancestors) observer.observe(node, {attributes:true,attributeFilter:['class','data-bs-theme']})
    media.addEventListener('change',layout)
    const emit = (name, detail) => container.dispatchEvent(new CustomEvent(name,{detail}))
    const closing = (result, authoritative = false) => {
      if (!entry.open) return false
      if (!authoritative && !container.dispatchEvent(new CustomEvent('beforeclose',{cancelable:true,detail:result}))) return false
      const index = stack.indexOf(entry)
      for (const child of stack.slice(index+1)) {child.result={reason:'parent'};child.open=false;child.cancelWork?.()}
      entry.result = result; entry.open = false; entry.authoritative = authoritative
      container.state.open = false; container.oncancelwork?.(); drain(); return true
    }
    entry.cancelWork = () => {container.state.open=false;container.oncancelwork?.()}
    entry.cancel = reason => closing({reason})
    entry.settle = result => {
      cycle = false; container.state.phase = 'closed'
      const done = resolve; resolve = null; promise = null
      if (!removed) {
        if (!entry.authoritative) emit('change',false)
        emit('closed',result)
        if (result.reason !== 'confirm') emit('cancel',{reason:result.reason})
      }
      done?.(result)
      if (removed) {instance?.dispose();panel.remove()}
    }
    entry.showPhysical = () => new Promise(done => {
      appearance();layout();panel.inert=false;container.state.phase='opening'
      panel.addEventListener('shown.bs.offcanvas',()=>{
        container.state.phase=entry.open?'open':'closing';layout()
        if (focusBeforeSuspend?.isConnected && panel.contains(focusBeforeSuspend)) focusBeforeSuspend.focus({preventScroll:true})
        focusBeforeSuspend=null
        if (!cycle && entry.open) {cycle=true;emit('opened',null)}
        done()
      },{once:true})
      instance.show(entry.opener)
    })
    entry.hidePhysical = () => new Promise(done => {
      if (panel.contains(document.activeElement)) {focusBeforeSuspend=document.activeElement;document.activeElement.blur()}
      container.state.phase=entry.open?'suspended':'closing'
      panel.inert=true
      panel.addEventListener('hidden.bs.offcanvas',()=>{panel.inert=true;layout();done()},{once:true})
      internalHide=true;instance.hide();internalHide=false
    })
    panel.addEventListener('hide.bs.offcanvas',event=>{
      if (event.target!==panel || internalHide) return
      event.preventDefault();closing({reason:'dismiss'})
    })
    panel.addEventListener('keydown',event=>{
      if (event.key==='Escape' && !event.isComposing && !event.defaultPrevented && !entry.static) {
        event.preventDefault();event.stopPropagation();closing({reason:'escape'})
      }
    })
    container.show = (silent = false) => {
      if (removed) return Promise.resolve({reason:'removed'})
      if (entry.open) return promise
      if (promise) return promise.then(()=>container.show(silent))
      const foreign=[...document.querySelectorAll('.modal.show,.modal.showing,.offcanvas.show,.offcanvas.showing,.offcanvas.hiding')].some(node=>!stack.some(item=>item.panel===node))
      if (foreign) return Promise.resolve({reason:'blocked'})
      entry.open=true;entry.result=null;entry.authoritative=false;entry.opener=document.activeElement
      container.state.open=true;container.state.phase='queued'
      promise=new Promise(done=>resolve=done);stack.push(entry)
      document.addEventListener('keydown',escape,true)
      if (!silent) emit('change',true)
      drain();return promise
    }
    container.close = value => closing({reason:'confirm',value})
    container.cancel = (reason='cancel') => closing({reason})
    Object.defineProperty(container,'value',{configurable:true,get:()=>entry.open,set:value=>{if(value===true)container.show(true);else closing({reason:'bind'},true)}})
    container.addEventListener('bind',event=>{container.value=event.detail})
    container.addEventListener('change',event=>{if(event.target!==container)event.stopImmediatePropagation()})
    entry.panel=panel
    panel.inert=true
    // Parse bindings in their original owner context before moving the surface.
    // The host stays in its View so removal always owns portal cleanup.
    const mount=setTimeout(()=>{
      if (removed) return
      document.body.appendChild(panel);appearance();layout()
      instance=bootstrap.Offcanvas.getOrCreateInstance(panel,{backdrop:entry.static?'static':true,keyboard:false,scroll:false})
      entry.ready=true;drain()
    },0)
    DOMDisposer.add(container,()=>{
      removed=true;clearTimeout(mount);observer.disconnect();media.removeEventListener('change',layout)
      if (entry.open) closing({reason:'removed'},true)
      else if (!promise) {instance?.dispose();panel.remove()}
    })
  }, globalThis.DrawerFrame(), Util.makeDom(`<style>
 [data-drawer-surface]{--bs-offcanvas-width:min(100vw,32rem);--bs-offcanvas-height:auto;max-height:100dvh;}
 [data-drawer-surface] .drawer-body{min-height:0;min-width:0;overscroll-behavior:contain;}
 [data-drawer-surface].offcanvas-bottom,[data-drawer-surface].offcanvas-top{max-height:90dvh;width:min(100%,48rem);margin-inline:auto;}
 [data-drawer-surface].offcanvas-bottom{border-radius:var(--bs-border-radius-lg) var(--bs-border-radius-lg) 0 0;}
 [data-drawer-surface] .drawer-footer{padding-bottom:max(var(--ui-tool-space,.5rem),env(safe-area-inset-bottom));}
 [data-drawer-surface] .drawer-footer:empty{display:none!important;}
 </style>`))
})()
