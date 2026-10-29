/** Shared sidebar: persistent desktop split, accessible narrow drawer. */
Component.register('SplitPane', container => {
  const number=(name,fallback)=>{const value=Number(container.getAttribute(name));return container.hasAttribute(name)&&Number.isFinite(value)&&value>0?value:fallback}
  const min=number('min',160),max=Math.max(min,number('max',560)),mainMin=number('main-min',240),breakpoint=number('breakpoint',768)
  container.state.width??=280
  container.state.pane??='main'
  container.state.sidebarenabled??=true
  container.state.resizable??=true
  container.state.narrow=false
  const sidebar=container.querySelector('[data-split-sidebar]'),resizer=container.querySelector('Resizer'),toggle=container.querySelector('[data-split-toggle]')
  sidebar.id ||= 'split-sidebar-'+UUID.make()
  toggle.setAttribute('aria-controls',sidebar.id)
  resizer.target=sidebar;resizer.setAttribute('min',String(min))
  let drawer=null,frame,disposed=false
  const publish=pane=>{if(container.state.pane===pane)return;container.state.pane=pane;container.dispatchEvent(new CustomEvent('panechange',{detail:pane}))}
  const syncDrawer=()=>{
    if(disposed||sidebar.matches('.showing,.hiding'))return
    if(container.state.narrow&&container.state.sidebarenabled){
      sidebar.classList.add('offcanvas','offcanvas-start')
      drawer ||= bootstrap.Offcanvas.getOrCreateInstance(sidebar,{backdrop:true,keyboard:true,scroll:false})
      if(container.state.pane==='sidebar'){if(!sidebar.classList.contains('show')){drawer.show();sidebar.focus()}}else drawer.hide()
    }else{
      drawer?.hide()
      sidebar.classList.remove('offcanvas','offcanvas-start')
    }
  }
  const schedule=()=>{if(disposed)return;cancelAnimationFrame(frame);frame=requestAnimationFrame(syncDrawer)}
  const layout=()=>{
    const available=container.clientWidth
    const narrow=container.state.sidebarenabled&&available<Math.max(breakpoint,min+mainMin+9)
    if(container.state.narrow!==narrow)container.state.narrow=narrow
    const limit=Math.max(min,Math.min(max,available-mainMin-9))
    resizer.setAttribute('max',String(limit))
    if(!container.state.narrow&&container.state.sidebarenabled){const value=Number(container.state.width);resizer.dispatchEvent(new CustomEvent('bind',{detail:Math.max(min,Math.min(limit,Number.isFinite(value)?value:280))}))}
    schedule()
  }
  container.show=pane=>{if(!['sidebar','main'].includes(pane))throw Error('SplitPane.show: expected sidebar or main');publish(pane);schedule()}
  container.toggle=()=>container.show(container.state.pane==='sidebar'?'main':'sidebar')
  container.addEventListener('bind',event=>{if(Number.isFinite(event.detail)&&event.detail>0)container.state.width=event.detail})
  resizer.addEventListener('change',event=>{container.state.width=event.detail;container.dispatchEvent(new CustomEvent('change',{detail:event.detail}))})
  sidebar.addEventListener('hide.bs.offcanvas',()=>{if(!disposed&&container.state.narrow&&container.state.pane==='sidebar')publish('main')})
  sidebar.addEventListener('shown.bs.offcanvas',schedule)
  sidebar.addEventListener('hidden.bs.offcanvas',()=>{if(!disposed&&container.state.narrow&&container.state.pane==='main')toggle.focus();schedule()})
  const stops=['width','sidebarenabled'].map(key=>container.state.__watch(key,layout));stops.push(container.state.__watch('pane',schedule))
  const observer=new ResizeObserver(layout);observer.observe(container)
  DOMDisposer.add(container,()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();stops.forEach(stop=>stop());if(drawer){if(sidebar.matches('.show,.showing,.hiding')){sidebar.addEventListener('hidden.bs.offcanvas',()=>drawer.dispose(),{once:true});if(sidebar.classList.contains('showing'))sidebar.addEventListener('shown.bs.offcanvas',()=>drawer.hide(),{once:true});else if(!sidebar.classList.contains('hiding'))drawer.hide()}else drawer.dispose()}})
  layout()
},Util.makeDom(`
<div class="d-flex flex-column overflow-hidden" $class="this.state.narrow?'split-narrow':''" style="flex:1 1 0%;min-width:0;min-height:0">
 <div class="split-tools flex-shrink-0" $.hidden="!this.state.narrow||this.hasAttribute('notoggle')">
  <button data-split-toggle type="button" class="btn btn-link text-body-secondary" aria-label="{#Show list#}" $aria-expanded="this.state.pane==='sidebar'?'true':'false'" $onclick="this.toggle()"><i class="bi bi-list" aria-hidden="true"></i></button>
 </div>
 <div class="d-flex flex-fill overflow-hidden" style="min-width:0;min-height:0">
  <aside data-split-sidebar tabindex="-1" aria-label="{#List navigation#}" class="d-flex flex-column flex-shrink-0 overflow-hidden bg-body" style="min-width:0;min-height:0" $.hidden="!this.state.sidebarenabled"><div class="d-flex justify-content-end p-2 flex-shrink-0" $.hidden="!this.state.narrow"><button class="btn-close" type="button" aria-label="{#Close list#}" $onclick="this.show('main')"></button></div><div slot-id="sidebar" data-split-content class="d-flex flex-column flex-fill overflow-hidden" style="min-width:0;min-height:0"></div></aside>
  <Resizer aria-label="{#Resize sidebar#}" $.hidden="this.state.narrow||!this.state.sidebarenabled||!this.state.resizable"></Resizer>
  <section slot-id="main" data-split-main class="d-flex flex-column flex-fill overflow-hidden" style="min-width:0;min-height:0"></section>
 </div>
</div>`),Util.makeDom(`
<style>
 SplitPane > .split-tools {padding:var(--ui-tool-space,.5rem);}
 SplitPane[notoggle] > .split-tools {display:none;}
 SplitPane > div > [hidden],SplitPane [data-split-sidebar] > [hidden] {display:none !important;}
 SplitPane [data-split-content] > :only-child,SplitPane > div > [data-split-main] > :only-child {flex:1 1 0%;min-width:0;min-height:0;}
 SplitPane.split-narrow > div > [data-split-sidebar] {width:min(22rem,calc(100% - 3rem)) !important;}
</style>`))
