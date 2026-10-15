/** RemoteSelect: bounded server-backed single-value lookup for AutoForm. */
globalThis.Component.register('RemoteSelect', container => {
	container.state=globalThis.NewState({value:'',query:'',options:[],loading:false,open:false})
	container.api=container.api||container.getAttribute('api')||''
	container.action=container.action||container.getAttribute('action')||'query'
	container.placeholder=container.placeholder||container.getAttribute('placeholder')||''
	container.optionValue=option=>String(option?.value??option?.id??option??'')
	container.optionLabel=option=>String(option?.label??option?.name??container.optionValue(option))
	let timer=0,request=0
	container.syncValidity=()=>{const input=container.querySelector('input');if(input)input.setCustomValidity((container.required||container.hasAttribute('required'))&&!container.state.value?'{#Select a result#}':'')}
	const setValue=value=>{container.state.value=String(value??'');if(!container.state.query)container.state.query=container.state.value;container.syncValidity();if(container.state.value)container.search(container.state.value)}
	container.addEventListener('bind',event=>setValue(event.detail))
	Object.defineProperty(container,'value',{get:()=>container.state.value,set:setValue,configurable:true})
	container.paramsValue=()=>typeof container.params==='function'?container.params():(container.params||{})
	container.search=async query=>{const api=String(container.api||''),action=String(container.action||'query');if(!api)return;const version=++request;container.state.loading=true;try{const response=await globalThis.HTTP.post({url:api,data:{action,...container.paramsValue(),query:String(query||''),limit:30}});if(version!==request)return;const result=response?.result;if(!response?.ok||!result?.ok)throw new Error(result?.error||response?.error||'Lookup failed');container.state.options=result.list||result.data||[];const selected=container.state.options.find(option=>container.optionValue(option)===container.state.value);if(selected)container.state.query=container.optionLabel(selected)}catch(error){globalThis.Toast?.show(error.message||String(error),{type:'danger'})}finally{if(version===request)container.state.loading=false}}
	container.schedule=query=>{container.state.query=query;container.state.open=true;if(container.state.value){container.state.value='';container.dispatchEvent(new CustomEvent('change',{detail:''}))}container.syncValidity();clearTimeout(timer);timer=setTimeout(()=>container.search(query),220)}
	container.choose=option=>{container.state.value=container.optionValue(option);container.state.query=container.optionLabel(option);container.state.open=false;container.syncValidity();container.dispatchEvent(new CustomEvent('change',{detail:container.state.value}))}
	container.clear=()=>{container.state.value='';container.state.query='';container.state.options=[];container.syncValidity();container.dispatchEvent(new CustomEvent('change',{detail:''}))}
	container._destroy=()=>clearTimeout(timer);globalThis.DOMDisposer?.add(container,container._destroy)
	queueMicrotask(container.syncValidity)
},globalThis.Util.makeDom(/*html*/`
<div class="position-relative"><div class="input-group" $class="this.closest('AutoForm')?.sm?'input-group-sm':''"><input class="form-control" autocomplete="off" $value="this.state.query" $placeholder="this.placeholder||'{#Search#}'" $onfocus="this.state.open=true;this.search(this.state.query)" $oninput="this.schedule(thisNode.value)" $onkeydown="if(event.key==='Escape')this.state.open=false"><button $if="this.state.value" type="button" class="btn btn-outline-secondary" title="{#Clear#}" $onclick="this.clear()"><i class="bi bi-x-lg"></i></button></div><div $if="this.state.open" class="dropdown-menu show w-100 overflow-auto" style="max-height:240px"><span $if="this.state.loading" class="dropdown-item-text text-body-secondary">{#Loading#}…</span><button $each="this.state.options||[]" type="button" class="dropdown-item" $class="this.optionValue(item)===this.state.value?'active':''" $text="this.optionLabel(item)" $onclick="this.choose(item)"></button><span $if="!this.state.loading&&!this.state.options?.length" class="dropdown-item-text text-body-secondary">{#No results#}</span></div></div>
`))
if(globalThis.AutoForm)globalThis.AutoForm.register('RemoteSelect')
