/** Hierarchical selection reuses List browsing and ResourcePicker's transaction. */
Component.register('TreeSelect',container=>{
  const mode=container.getAttribute('mode')||'tree',multiple=container.hasAttribute('multiple'),parents=container.hasAttribute('selectparents')
  if(!['tree','cascade'].includes(mode)||mode==='cascade'&&multiple)throw Error('TreeSelect: cascade is single selection')
  container.state=NewState({nodes:[],value:multiple?[]:'',trail:[],query:'',search:'',loading:'',error:''})
  container.mode=mode
  container.multiple=multiple
  const picker=container.querySelector('ResourcePicker')
  picker.setAttribute('labelfield','label')
  if(multiple)picker.setAttribute('multiple','')
  picker.setAttribute('title',container.getAttribute('title')||'{#Choose a location#}')
  if(container.hasAttribute('required'))picker.setAttribute('required','')
  if(container.hasAttribute('disabled'))picker.setAttribute('disabled','')
  let version=0,controller,disposed=false
  const normalize=items=>{
    if(!Array.isArray(items))throw Error('TreeSelect: expected flat node array')
    const nodes=items.map(node=>({...node,id:String(node.id??''),label:String(node.label??node.name??node.id??''),parent:String(node.parent??'')}))
    if(nodes.some(node=>!node.id)||new Set(nodes.map(node=>node.id)).size!==nodes.length)throw Error('TreeSelect: unique nonempty ids required')
    const byId=new Map(nodes.map(node=>[node.id,node]))
    for(const node of nodes){const seen=new Set([node.id]);let parent=node.parent;while(parent&&byId.has(parent)){if(seen.has(parent))throw Error('TreeSelect: cyclic parents');seen.add(parent);parent=byId.get(parent).parent}}
    return nodes
  }
  Object.defineProperty(container,'items',{get:()=>container.state.nodes,set:value=>{container.state.nodes=normalize(value);container.state.trail=[]},configurable:true})
  Object.defineProperty(container,'value',{get:()=>container.state.value,set:value=>{container.state.value=multiple?[...new Set((Array.isArray(value)?value:[]).map(String))]:String(value??'')},configurable:true})
  container.addEventListener('bind',event=>{container.value=event.detail})
  container.node=id=>container.state.nodes.find(node=>node.id===String(id))
  container.path=id=>{const result=[],seen=new Set();let node=container.node(id);while(node&&!seen.has(node.id)){seen.add(node.id);result.unshift(node);node=container.node(node.parent)}return result}
  container.label=()=>{const ids=Array.isArray(container.value)?container.value:[container.value].filter(Boolean);return ids.map(id=>container.path(id).map(node=>node.label).join(' / ')||id).join(', ')||container.getAttribute('title')||'{#Choose a location#}'}
  container.hasChildren=node=>!!node?.hasChildren||container.state.nodes.some(item=>item.parent===node?.id)
  container.canSelect=node=>!!node&&!node.disabled&&(parents||!container.hasChildren(node))
  container.visible=()=>{
    const nodes=container.state.nodes,q=container.state.search.trim().toLowerCase()
    if(!q)return mode==='tree'?nodes:nodes.filter(node=>node.parent===(container.state.trail.at(-1)||''))
    const matches=nodes.filter(node=>node.label.toLowerCase().includes(q))
    if(mode==='cascade')return matches.map(node=>({...node,summary:container.path(node.id).slice(0,-1).map(n=>n.label).join(' / ')}))
    const keep=new Set(matches.flatMap(node=>container.path(node.id).map(item=>item.id)));return nodes.filter(node=>keep.has(node.id))
  }
  container.choose=node=>{const current=container.node(node?.id??node);if(container.canSelect(current)&&!container.state.loading)picker.toggle(current)}
  container.clear=()=>{if(container.hasAttribute('disabled'))return;container.value=multiple?[]:'';container.dispatchEvent(new CustomEvent('change',{detail:container.value}))}
  container.show=()=>picker.show()
  picker.addEventListener('show.bs.modal',()=>setTimeout(()=>{if(mode!=='tree')return;const list=container.querySelector('List');const ids=Array.isArray(container.value)?container.value:[container.value];for(const id of ids)for(const node of container.path(id).slice(0,-1))list?.expandItem(node.id)},0))
  container.runSearch=()=>{container.state.search=container.state.query;setTimeout(()=>{if(mode==='tree'&&container.state.search)container.querySelector('List')?.expandAll()},0)}
  container.cancel=()=>{version++;controller?.abort();container.state.loading='';picker.cancel()}
  container.expand=async(node,event)=>{
    node=container.node(node?.id??node)
    if(!node||node.disabled||!container.hasChildren(node))return
    if(node.hasChildren&&!container.state.nodes.some(item=>item.parent===node.id)&&typeof container.loadchildren==='function'){
      event?.preventDefault();controller?.abort();controller=new AbortController();const signal=controller.signal,current=++version
      container.state.loading=node.id;container.state.failedBranch=node.id;container.state.error=''
      try{const children=await container.loadchildren({...node},signal);if(disposed||current!==version)return;const incoming=normalize(children.map(child=>({...child,parent:child.parent??node.id})));const ids=new Set(incoming.map(item=>item.id));container.state.nodes=normalize([...container.state.nodes.filter(item=>!ids.has(item.id)),...incoming]);if(!incoming.length)container.state.nodes=container.state.nodes.map(item=>item.id===node.id?{...item,hasChildren:false}:item)}
      catch{if(!signal.aborted&&current===version)container.state.error='{#Unable to load this branch. Retry.#}';return}
      finally{if(!disposed&&current===version)container.state.loading=''}
    }
    if(!container.hasChildren(container.node(node.id)))return
    if(mode==='cascade')container.state.trail=container.path(node.id).map(item=>item.id)
    else{await new Promise(resolve=>setTimeout(resolve,0));container.querySelector('List')?.expandItem(node.id)}
  }
  container.beforeExpand=event=>{if(event.target?.tagName==='LIST')void container.expand(event.detail.item,event)}
  container.navigate=node=>{const list=container.querySelector('List');if(mode==='tree'&&list?.isExpanded(node.id))list.collapseItem(node.id);else container.expand(node)}
  container.back=index=>{container.state.search='';container.state.query='';container.state.trail=container.state.trail.slice(0,index)}
  container.key=event=>{
    const input=event.target.closest?.('[data-tree-choice]');if(!input)return
    const node=container.node(input.dataset.treeChoice),choices=[...container.querySelectorAll('[data-tree-choice]')].filter(el=>el.getClientRects().length&&!el.disabled)
    const current=choices.indexOf(input);let next
    if(event.key==='ArrowDown')next=Math.min(choices.length-1,current+1);else if(event.key==='ArrowUp')next=Math.max(0,current-1);else if(event.key==='Home')next=0;else if(event.key==='End')next=choices.length-1
    else if(event.key==='ArrowRight'&&container.hasChildren(node)){event.preventDefault();container.expand(node);return}
    else if(event.key==='ArrowLeft'){event.preventDefault();if(mode==='cascade')container.back(Math.max(0,container.state.trail.length-1));else{container.querySelector('List')?.collapseItem(node.id);choices.find(el=>el.dataset.treeChoice===node.parent)?.focus()}return}
    if(next!=null){event.preventDefault();choices[next]?.focus()}
  }
  picker.addEventListener('change',event=>{if(event.target!==picker)return;container.value=event.detail;container.dispatchEvent(new CustomEvent('change',{detail:container.value}))})
  picker.addEventListener('cancel',()=>{version++;controller?.abort();container.state.loading='';container.state.error='';container.dispatchEvent(new CustomEvent('cancel'))})
  container.addEventListener('keydown',container.key)
  container.addEventListener('change',event=>{if(event.target!==container)event.stopImmediatePropagation()})
  DOMDisposer.add(container,()=>{disposed=true;version++;controller?.abort()})
},Util.makeDom(`
<div class="tree-select d-block">
 <ResourcePicker $.items="this.state.nodes" $.value="this.state.value" $.validate="()=>this.state.loading?'{#Wait for this branch to finish loading.#}':this.state.error">
  <span slot="selection" $text="thisNode.closest('TreeSelect').label()"></span>
  <div slot="content" class="d-flex flex-column h-100">
   <form class="ui-toolbar px-2 px-sm-3 d-flex gap-2 border-bottom" data-no-changebind $onsubmit="event.preventDefault();event.stopPropagation();thisNode.closest('TreeSelect').runSearch()"><input class="form-control" type="search" aria-label="{#Search hierarchy#}" placeholder="{#Search#}" $bind="thisNode.closest('TreeSelect').state.query"><button class="btn btn-primary" aria-label="{#Search#}" type="submit"><i class="bi bi-search" aria-hidden="true"></i><span class="d-none d-sm-inline ms-sm-1">{#Search#}</span></button></form>
   <div class="d-flex flex-wrap gap-1 px-3 py-2 border-bottom" $if="thisNode.closest('TreeSelect').mode==='cascade'"><button class="btn btn-link" type="button" $onclick="thisNode.closest('TreeSelect').back(0)">{#All#}</button><button class="btn btn-link" type="button" $each="thisNode.closest('TreeSelect').state.trail" as="ancestor" $text="thisNode.closest('TreeSelect').node(ancestor)?.label" $onclick="thisNode.closest('TreeSelect').back(index+1)"></button></div>
   <div class="alert alert-danger m-3" role="alert" $if="thisNode.closest('TreeSelect').state.error"><span $text="thisNode.closest('TreeSelect').state.error"></span><button type="button" class="btn btn-link text-danger" $onclick="thisNode.closest('TreeSelect').expand(thisNode.closest('TreeSelect').node(thisNode.closest('TreeSelect').state.failedBranch))">{#Retry#}</button></div>
   <div class="text-body-secondary px-3 py-2" role="status" $if="thisNode.closest('TreeSelect').state.loading">{#Loading#}…</div>
   <List class="flex-fill" itemicon="" mode="tree" collapsible default-collapsed haschildrenfield="hasChildren" $.state.list="thisNode.closest('TreeSelect').visible()" $onbeforeexpand="thisNode.closest('TreeSelect').beforeExpand(event)" $onitemclick="thisNode.closest('TreeSelect').canSelect(event.detail.item)?thisNode.closest('TreeSelect').choose(event.detail.item):thisNode.closest('TreeSelect').navigate(event.detail.item)" $if="thisNode.closest('TreeSelect').mode==='tree'">
    <template slot="item"><div class="list-group-item border-0 bg-transparent d-flex align-items-center gap-2" $style="'padding-inline-start:calc(var(--ui-item-x,1rem) + '+Math.max(0,thisNode.closest('TreeSelect').path(item.id).length-1)+' * 1.25rem)'">
     <button class="btn btn-link text-body p-0 d-flex align-items-center justify-content-start gap-2" $class="thisNode.closest('TreeSelect').canSelect(item)?'':'flex-fill text-start'" type="button" $if="thisNode.closest('TreeSelect').hasChildren(item)" $data-tree-choice="item.id" $aria-label="'{#Open branch#} '+item.label" $aria-expanded="thisNode.closest('TreeSelect').querySelector('List')?.isExpanded(item.id)?'true':'false'" $disabled="item.disabled||!!thisNode.closest('TreeSelect').state.loading" $onclick="thisNode.closest('TreeSelect').navigate(item)"><i class="bi" $class="thisNode.closest('TreeSelect').querySelector('List')?.isExpanded(item.id)?'bi-caret-down-fill':'bi-caret-right-fill'" aria-hidden="true"></i><span class="list-primary-text text-break" $if="!thisNode.closest('TreeSelect').canSelect(item)" $text="item.label"></span></button>
     <label class="d-flex align-items-center gap-2 flex-fill mb-0" $if="thisNode.closest('TreeSelect').canSelect(item)||!thisNode.closest('TreeSelect').hasChildren(item)"><input class="form-check-input m-0 flex-shrink-0" $type="thisNode.closest('TreeSelect').multiple?'checkbox':'radio'" $name="thisNode.closest('TreeSelect').querySelector('ResourcePicker').selectionName" $data-tree-choice="item.id" $aria-label="item.label" $.checked="thisNode.closest('TreeSelect').querySelector('ResourcePicker').pending.includes(item.id)" $disabled="!thisNode.closest('TreeSelect').canSelect(item)||!!thisNode.closest('TreeSelect').state.loading" $onchange="thisNode.closest('TreeSelect').choose(item)"><span class="list-primary-text text-break" $text="item.label"></span></label><span slot-id="item-extra"></span>
    </div></template>
   </List>
   <List class="flex-fill" itemicon="" $onitemclick="thisNode.closest('TreeSelect').canSelect(event.detail.item)?thisNode.closest('TreeSelect').choose(event.detail.item):thisNode.closest('TreeSelect').expand(event.detail.item)" $.state.list="thisNode.closest('TreeSelect').visible()" $if="thisNode.closest('TreeSelect').mode==='cascade'">
    <template slot="item-actions"><div class="d-flex align-items-center gap-2"><button class="btn btn-link" type="button" $if="thisNode.closest('TreeSelect').hasChildren(item)" $data-tree-choice="item.id" $aria-label="'{#Open#} '+item.label" $disabled="item.disabled||!!thisNode.closest('TreeSelect').state.loading" $onclick="event.stopPropagation();thisNode.closest('TreeSelect').expand(item)"><i class="bi bi-chevron-right" aria-hidden="true"></i></button><input class="form-check-input m-0" $if="thisNode.closest('TreeSelect').canSelect(item)||!thisNode.closest('TreeSelect').hasChildren(item)" type="radio" $name="thisNode.closest('TreeSelect').querySelector('ResourcePicker').selectionName" $data-tree-choice="item.id" $aria-label="item.label" $.checked="thisNode.closest('TreeSelect').querySelector('ResourcePicker').pending.includes(item.id)" $disabled="!thisNode.closest('TreeSelect').canSelect(item)||!!thisNode.closest('TreeSelect').state.loading" $onchange="event.stopPropagation();thisNode.closest('TreeSelect').choose(item)"></div></template>
   </List>
   <p class="text-body-secondary text-center p-3" $if="!thisNode.closest('TreeSelect').visible().length&&!thisNode.closest('TreeSelect').state.loading">{#No results#}</p>
  </div>
 </ResourcePicker>
</div>`))
