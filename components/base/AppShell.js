/** Application chrome delegates sidebar sizing/drawer behavior to SplitPane. */
Component.register('AppShell',container=>{
 container.state.navOpen??=false
 container.state.navwidth??=240
 container.state.detail??=false
 container.state.hasNavigation=!!container.querySelector('[data-shell-navigation]').children.length
 const split=container.querySelector('SplitPane'),navigation=container.querySelector('[data-shell-navigation]'),bottom=container.querySelector('[data-shell-bottom]'),side=container.querySelector('[data-shell-side]'),toggle=container.querySelector('[data-shell-toggle]')
 const adaptive=container.getAttribute('navigation')==='adaptive'
 let frame,disposed=false,sidebarConnected=false
 const configure=()=>{
  if(disposed)return
  if(!split.state){schedule();return}
  if(!sidebarConnected){sidebarConnected=true;stops.push(split.state.__watch('narrow',schedule))}
  const width=container.clientWidth,mode=adaptive?(width<600?'bottom':width<960?'rail':'sidebar'):'sidebar'
  if(container.state.navigationMode!==mode)container.state.navigationMode=mode
  container.state.narrow=container.state.hasNavigation&&container.state.navigationMode!=='bottom'&&split.state.narrow
  const destination=mode==='bottom'?bottom:side
  if(navigation.parentElement!==destination)destination.appendChild(navigation)
  navigation.hidden=mode==='bottom'&&container.state.detail
  const enabled=container.state.hasNavigation&&mode!=='bottom'
  if(split.state.sidebarenabled!==enabled)split.state.sidebarenabled=enabled
  if(split.state.resizable!==(mode!=='rail'))split.state.resizable=mode!=='rail'
  const navwidth=mode==='rail'?72:container.state.navwidth
  if(split.state.width!==navwidth)split.state.width=navwidth
  for(const nav of navigation.querySelectorAll('Nav[adaptive]'))nav.setOrientation?.(mode==='bottom'?'bar':mode==='rail'?'rail':'vertical')
 }
 const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(configure)}
 container.toggleNavigation=()=>{container.state.navOpen=!container.state.navOpen}
 container.resizeNavigation=value=>{container.state.navwidth=value;container.dispatchEvent(new CustomEvent('change',{detail:value}))}
 container.addEventListener('bind',event=>{if(event.target===container&&Number.isFinite(event.detail)&&event.detail>0)container.state.navwidth=event.detail})
 split.addEventListener('change',event=>container.resizeNavigation(event.detail))
 split.addEventListener('panechange',event=>{container.state.navOpen=event.detail==='sidebar';if(!container.state.navOpen&&split.state.narrow)toggle.focus()})
 const stops=[container.state.__watch('navOpen',()=>split.show?.(container.state.navOpen?'sidebar':'main')),container.state.__watch('navwidth',schedule),container.state.__watch('detail',schedule)]
 const observer=new ResizeObserver(schedule);observer.observe(container)
 const mutation=new MutationObserver(schedule);mutation.observe(navigation,{childList:true,subtree:true})
 DOMDisposer.add(container,()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();mutation.disconnect();stops.forEach(stop=>stop())})
 configure()
},Util.makeDom(`
<div class="d-flex flex-column bg-body text-body overflow-hidden" style="min-width:0;min-height:0;flex:1 1 0%">
 <header class="d-flex align-items-center flex-nowrap border-bottom flex-shrink-0">
  <button data-shell-toggle type="button" class="btn btn-link text-body-secondary m-1 flex-shrink-0" $.hidden="!this.state.narrow||!this.state.hasNavigation||this.state.navigationMode==='bottom'" aria-label="{#Toggle navigation#}" $aria-expanded="this.state.navOpen?'true':'false'" $onclick="this.toggleNavigation()"><i class="bi bi-list" aria-hidden="true"></i></button>
  <div slot-id="header" data-shell-header class="d-flex align-items-center flex-nowrap flex-fill"></div>
 </header>
 <SplitPane notoggle min="56" max="420" main-min="280" breakpoint="600" class="flex-fill">
  <div slot="sidebar" data-shell-side class="d-flex flex-column flex-fill overflow-hidden"><div slot-id="navigation" data-shell-navigation role="navigation" aria-label="{#Application#}" class="d-flex flex-column flex-fill overflow-hidden"></div></div>
  <main slot="main" slot-id="content" data-shell-content class="d-flex flex-column flex-fill overflow-hidden"></main>
 </SplitPane>
 <div data-shell-bottom class="flex-shrink-0 border-top"></div>
</div>`),Util.makeDom(`
<style>
 AppShell[viewport] {height:100dvh;}
 AppShell > header > [data-shell-header] {gap:var(--ui-gap,.5rem);padding:var(--ui-tool-space,.5rem);min-width:0;}
 AppShell > header > [hidden],AppShell [data-shell-navigation][hidden] {display:none !important;}
 AppShell [data-shell-content] {min-width:0;min-height:0;}
 AppShell [data-shell-content] > :only-child {flex:1 1 0%;min-width:0;min-height:0;}
 AppShell [data-shell-bottom]:empty {display:none;}
</style>`))
