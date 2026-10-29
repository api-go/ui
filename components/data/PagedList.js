/** Paged list with opt-in tools and selection, without virtualization. */
Component.register('PagedList',container=>{
  const initial=container.source,owned=initial?null:ListDataSource.create({items:[]})
  Object.defineProperty(container,'source',{get:()=>container.state.source,set:value=>{container.state.source=value},configurable:true})
  container.state.source=initial||owned
  container.state.selection??=[];container.state.sortoptions??=[]
  container.state.columns??=[]
  const inheritFilterFields=container.state.filterfields==null
  container.state.filterfields??=container.source.filterfields||[]
  container.state.filterdraft??=NewState({...container.source.state.filters})
  container.state.showheader??=!container.hasAttribute('hideheader')
  container.state.view??=container.getAttribute('view')||'list'
  container.state.scroll??=container.getAttribute('scroll')||'internal'
  const normalizeView=value=>{if(!['list','cards'].includes(value))container.state.view='list'}
  const normalizeScroll=value=>{if(!['internal','document'].includes(value))container.state.scroll='internal'}
  normalizeView(container.state.view);normalizeScroll(container.state.scroll)
  container.state.__watch('view',normalizeView);container.state.__watch('scroll',normalizeScroll)
  container.state.height??=container.getAttribute('height')||'32rem'
  container.cellValue=(column,item)=>typeof column.format==='function'?column.format(item[column.name],item):(item[column.name]??'')
  let sortToggle
  container._sort=value=>{
    // Close the native menu before reactive classes update its toggle.
    sortToggle=container.querySelector('[data-list-sort]')
    if(sortToggle)bootstrap.Dropdown.getOrCreateInstance(sortToggle).hide()
    container.source.setQuery({sort:value})
  }
  container.resetFilters=()=>{container.state.searchdraft='';for(const key of Object.keys(container.state.filterdraft))container.state.filterdraft[key]='';container.search()}
  container.state.searchdraft??=container.source.state.search
  container.state.searchable??=container.hasAttribute('searchable')
  container.state.sortable??=container.hasAttribute('sortable')
  container.state.selectable??=container.hasAttribute('selectable')
  container.state.hidepagination??=container.hasAttribute('hidepagination')
  const idfield=container.getAttribute('idfield')||'id'
  container.querySelector('[data-list-rows]').setAttribute('key',idfield)
  container.model=()=>container.source.state
  container.keyOf=item=>item[idfield]
  container.selected=item=>container.state.selection.includes(container.keyOf(item))
  const publish=ids=>{container.state.selection=ids;container.dispatchEvent(new CustomEvent('selectionchange',{detail:[...ids]}))}
  container.toggle=item=>{if(!container.state.selectable||container.model().loading)return false;const id=container.keyOf(item);if(id==null)return false;publish(container.selected(item)?container.state.selection.filter(key=>key!==id):[...container.state.selection,id]);return true}
  container.selectAll=()=>{if(!container.state.selectable||container.model().loading)return false;publish([...new Set(container.model().rows.map(container.keyOf).filter(id=>id!=null))]);return true}
  container.clearSelection=()=>{if(!container.state.selection.length)return false;publish([]);return true}
  container.search=()=>{
    const query={search:container.state.searchdraft,filters:Object.fromEntries(Object.entries(container.state.filterdraft).filter(([,value])=>value!=null&&value!==''))}
    const unchanged=container.source.state.search===query.search&&JSON.stringify(container.source.state.filters)===JSON.stringify(query.filters)
    container.source.setQuery(query);if(unchanged)container.source.reload()
  }
  container.activate=item=>container.dispatchEvent(new CustomEvent('itemclick',{detail:{item}}))
  let release=()=>{},attached=false
  const syncDraft=source=>{
    container.state.searchdraft=source.state.search
    const draft=container.state.filterdraft,values=source.state.filters
    for(const key of new Set([...Object.keys(draft),...Object.keys(values)]))draft[key]=values[key]??''
  }
  const attach=source=>{
    release();container.clearSelection();if(attached)syncDraft(source)
    if(inheritFilterFields)container.state.filterfields=source.filterfields||[]
    attached=true
    const query=event=>{container.clearSelection();syncDraft(source);container.dispatchEvent(new CustomEvent('querychange',{detail:event.detail}))}
    source.addEventListener('querychange',query);release=()=>source.removeEventListener('querychange',query)
  }
  container.state.__watch('source',attach);attach(container.source)
  container.state.__watch('selectable',value=>{if(!value)container.clearSelection()})
  DOMDisposer.add(container,()=>{release();owned?.dispose();if(sortToggle)bootstrap.Dropdown.getInstance(sortToggle)?.dispose()})
},Util.makeDom(`
<div class="paged-list-root d-flex flex-column" $data-scroll="this.state.scroll" $style="this.state.scroll==='document'?'height:auto':'height:'+this.state.height">
  <div class="paged-list-toolbar ui-toolbar d-flex align-items-start px-2 px-sm-3 border-bottom" $if="this.state.searchable||this.state.filterfields.length||this.state.sortable" data-no-changebind>
    <form class="ui-toolbar-fields d-flex flex-wrap align-items-center flex-fill" role="search" aria-label="{#Filters#}" $if="this.state.searchable||this.state.filterfields.length" $onsubmit="event.preventDefault();event.stopPropagation();this.search()">
      <div class="input-group paged-list-search" $if="this.state.searchable"><span class="input-group-text text-body-secondary"><i class="bi bi-search" aria-hidden="true"></i></span><input class="form-control" aria-label="{#Search#}" placeholder="{#Search#}" type="search" $bind="this.state.searchdraft" $disabled="this.model().loading"></div>
      <div class="input-group paged-list-filter" $each="this.state.filterfields" as="field"><span class="input-group-text text-body-secondary" $text="field.label||field.name"></span>
        <select $if="field.type==='select'" class="form-select" $aria-label="field.label||field.name" $bind="this.state.filterdraft[field.name]" $disabled="this.model().loading"><option value="">{#All#}</option><option $each="field.options||[]" as="choice" $value="String(choice.value??choice)" $text="choice.label??choice"></option></select>
        <input $if="field.type!=='select'" class="form-control" $type="['number','date'].includes(field.type)?field.type:'text'" $aria-label="field.label||field.name" $placeholder="field.placeholder||''" $bind="this.state.filterdraft[field.name]" $disabled="this.model().loading">
      </div>
      <button class="btn btn-primary" type="submit" aria-label="{#Search#}" title="{#Search#}" $disabled="this.model().loading"><i class="bi bi-search" aria-hidden="true"></i><span class="d-none d-sm-inline ms-sm-1">{#Search#}</span></button>
    </form>
    <div class="dropdown flex-shrink-0 ms-auto" $class="this.state.searchable||this.state.filterfields.length?'border-start ps-2':''" $if="this.state.sortable">
      <button type="button" class="btn" $class="this.model().sort?'btn-primary':'btn-outline-secondary'" data-bs-toggle="dropdown" data-list-sort aria-label="{#Sort#}" title="{#Sort#}" $disabled="this.model().loading"><i class="bi bi-sort-down" aria-hidden="true"></i></button>
      <div class="dropdown-menu dropdown-menu-end"><h6 class="dropdown-header">{#Sort#}</h6><button type="button" class="dropdown-item" $onclick="this._sort('')">{#Default order#}</button><button type="button" class="dropdown-item" $each="this.state.sortoptions" as="order" $onclick="this._sort(order.value)" $text="order.label"></button></div>
    </div>
  </div>
  <div slot-id="toolbar" class="px-2"></div>
  <div class="paged-list-body flex-fill">
  <div slot-id="header" class="paged-list-header" $class="this.state.scroll==='internal'?'position-sticky top-0 z-1':''" $if="this.state.showheader&&this.state.view==='list'">
    <template $if="this.state.columns.length"><div class="d-flex align-items-center gap-3 px-2 px-sm-3 py-2 border-bottom bg-body-tertiary fw-semibold small">
    <span class="paged-list-selection-spacer" $if="this.state.selectable"></span>
    <div class="row g-2 flex-nowrap flex-fill"><div class="paged-list-cell" $each="this.state.columns" as="column" $class="(column.class||'col')+' text-'+(column.align||'start')" $text="column.label||column.name"></div></div>
    </div></template>
  </div>
    <RequestState $.state.loading="this.model().loading" $.state.error="this.model().error" $.state.empty="this.model().loaded&&!this.model().rows.length" $.state.hasdata="this.model().rows.length>0" $onretry="this.source.reload()">
      <div slot="content" $class="this.parent.state.view==='cards'?'paged-list-cards gap-3 py-3 px-2 px-sm-3':'list-group list-group-flush'">
        <div data-list-rows $each="this.parent.model().rows" as="item" index="rowIndex">
          <article $class="(this.parent.state.view==='cards'?'card paged-list-card h-100':'list-group-item px-2 px-sm-3')+(this.parent.selected(item)?' bg-primary-subtle':'')" $aria-selected="this.parent.selected(item)?'true':'false'">
            <div class="d-flex gap-3" $class="this.parent.state.view==='cards'?'card-body align-items-start':'align-items-center'">
              <input $if="this.parent.state.selectable" class="form-check-input flex-shrink-0 m-0" type="checkbox" $aria-label="{#Select item#}: \${item.name??item.label??item.id}" $.checked="this.parent.selected(item)" $disabled="this.parent.model().loading" $onchange="event.stopPropagation();this.parent.toggle(item)">
              <div slot-id="item" class="paged-list-item-content flex-fill" $ondblclick="this.parent.activate(item)">
                <template $if="!this.parent.state.columns.length"><div class="fw-medium text-break" $text="item.name??item.label??item.id"></div><div class="small text-body-secondary text-break" $if="item.summary" $text="item.summary"></div></template>
                <div $if="this.parent.state.columns.length" $class="this.parent.state.view==='cards'?'d-flex flex-column gap-2':'row g-2 flex-nowrap'">
                  <div class="paged-list-cell" $each="this.parent.state.columns" as="column" $class="this.parent.state.view==='cards'?'d-flex justify-content-between gap-2':(column.class||'col')+' text-'+(column.align||'start')"><span class="small text-body-secondary" $if="this.parent.state.view==='cards'" $text="column.label||column.name"></span><span class="text-break" $text="this.parent.cellValue(column,item)"></span></div>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
      <div slot="empty" class="p-4 text-center text-body-secondary" slot-id="empty">{#No results#}</div>
    </RequestState>
  </div>
  <div slot-id="pagination" class="paged-list-footer ui-toolbar border-top px-2 px-sm-3" $if="!this.state.hidepagination">
    <Pagination $.source="this.source">
      <div slot="settings" slot-id="settings"></div>
      <template slot="actions"><div class="d-flex align-items-center gap-2 small ps-2 ui-sm">
        <template $if="this.parent.state.selectable">
          <input class="form-check-input m-0" type="checkbox" aria-label="{#Select page#}" title="{#Select page#}" $.checked="this.parent.model().rows.length>0&&this.parent.state.selection.length===this.parent.model().rows.length" $.indeterminate="this.parent.state.selection.length>0&&this.parent.state.selection.length<this.parent.model().rows.length" $disabled="this.parent.model().loading||!this.parent.model().rows.length" $onchange="event.stopPropagation();this.parent.state.selection.length===this.parent.model().rows.length?this.parent.clearSelection():this.parent.selectAll()">
          <span $if="this.parent.state.selection.length"><span class="d-none d-md-inline text-body-secondary">{#Selected#}: </span><strong class="text-body" $text="this.parent.state.selection.length"></strong></span>
          <button type="button" class="btn btn-link text-body-secondary px-1 py-0" aria-label="{#Clear#}" title="{#Clear#}" $if="this.parent.state.selection.length" $onclick="this.parent.clearSelection()"><i class="bi bi-x-lg d-sm-none" aria-hidden="true"></i><span class="d-none d-sm-inline">{#Clear#}</span></button>
          <div slot-id="selection-actions" class="d-flex gap-2"></div>
        </template>
      </div></template>
    </Pagination>
  </div>
</div>`),Util.makeDom(`<style>
PagedList {display:block;min-width:0;min-height:0;height:100%;}
PagedList.paged-list-root {min-height:0;max-height:100%;}
PagedList.paged-list-root[data-scroll=internal] > .paged-list-body {overflow:auto;min-height:0;}
PagedList.paged-list-root[data-scroll=document] > .paged-list-body {overflow:visible;}
PagedList.paged-list-root[data-scroll=document] {max-height:none;}
PagedList .paged-list-toolbar form, PagedList .paged-list-cell, PagedList .paged-list-item-content {min-width:0;}
PagedList .paged-list-search {flex:1 1 12rem;}
PagedList .paged-list-filter {flex:1 1 14rem;}
PagedList .paged-list-filter .form-select {min-width:calc(4ch + 3rem);}
PagedList .paged-list-toolbar, PagedList .paged-list-header, PagedList .paged-list-footer {flex-shrink:0;}
PagedList .paged-list-cards {display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,18rem),1fr));}
PagedList [data-list-rows] {min-width:0;}
PagedList .paged-list-selection-spacer {width:1em;flex-shrink:0;}
</style>`))
