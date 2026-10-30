/** Transport belongs to the host; this component owns only bounded UI jobs. */
Component.register('FileUpload',container=>{
  const limit=(name,fallback)=>Math.max(1,Number(container.getAttribute(name))||fallback)
  const maxfiles=limit('maxfiles',10),maxbytes=limit('maxbytes',20*1024*1024),concurrency=Math.min(6,limit('concurrency',2))
  const accept=container.getAttribute('accept')||'',disabled=container.hasAttribute('disabled')
  container.state=NewState({value:[],jobs:[],error:'',dragging:false})
  let removed=false,serial=0
  const controllers=new Map(),files=new Map()
  Object.defineProperty(container,'value',{get:()=>container.state.value,set:items=>{for(const c of controllers.values())c.abort();controllers.clear();files.clear();container.state.jobs=[];container.state.value=Array.isArray(items)?items.map(item=>({...item})):[]},configurable:true})
  container.addEventListener('bind',event=>{container.value=event.detail})
  const emit=()=>container.dispatchEvent(new CustomEvent('change',{detail:container.value.map(item=>({...item}))}))
  const update=(id,patch)=>{container.state.jobs=container.state.jobs.map(job=>job.id===id?{...job,...patch}:job)}
  const allowed=file=>!accept||accept.split(',').some(part=>{const rule=part.trim().toLowerCase();return rule.startsWith('.')?file.name.toLowerCase().endsWith(rule):rule.endsWith('/*')?file.type.toLowerCase().startsWith(rule.slice(0,-1)):file.type.toLowerCase()===rule})
  container.enqueue=input=>{
    if(disabled||removed)return
    container.state.error=''
    if(typeof container.upload!=='function'){container.state.error='{#Upload service is not configured.#}';return}
    for(const file of Array.from(input||[])){
      if(!(file instanceof File)||!allowed(file)||file.size>maxbytes){container.state.error='{#Some files exceed the allowed size or type.#}';continue}
      if(container.value.length+container.state.jobs.length>=maxfiles){container.state.error='{#Maximum file count reached.#}';break}
      const id=String(++serial);files.set(id,file);container.state.jobs=[...container.state.jobs,{id,name:file.name,size:file.size,status:'queued',progress:null}]
    }
    pump()
  }
  const pump=()=>{
    if(removed)return
    for(const job of container.state.jobs.filter(job=>job.status==='queued')){
      if(controllers.size>=concurrency)break
      const controller=new AbortController();controllers.set(job.id,controller);update(job.id,{status:'uploading'})
      const file=files.get(job.id)
      Promise.resolve().then(()=>{if(removed||controller.signal.aborted)return;return container.upload(file,{signal:controller.signal,onProgress:value=>{
        if(controllers.get(job.id)!==controller||controller.signal.aborted||removed)return
        const progress=Number(value);if(Number.isFinite(progress))update(job.id,{progress:Math.max(0,Math.min(100,progress))})
      }})}).then(result=>{
        if(removed||controller.signal.aborted||controllers.get(job.id)!==controller)return
        if(!result||typeof result.id!=='string'||!result.id||container.value.some(item=>item.id===result.id))throw Error('Invalid attachment')
        container.state.value=[...container.value,{...result,name:result.name||job.name,size:result.size??job.size}]
        container.state.jobs=container.state.jobs.filter(item=>item.id!==job.id);files.delete(job.id);emit()
      }).catch(()=>{if(!removed&&!controller.signal.aborted&&controllers.get(job.id)===controller)update(job.id,{status:'error',progress:null})})
        .finally(()=>{if(controllers.get(job.id)===controller)controllers.delete(job.id);pump()})
    }
  }
  container.cancel=id=>{const key=String(id);controllers.get(key)?.abort();controllers.delete(key);files.delete(key);container.state.jobs=container.state.jobs.filter(job=>job.id!==key);pump()}
  container.retry=id=>{if(disabled||removed)return;const job=container.state.jobs.find(job=>job.id===String(id));if(job?.status==='error'){update(job.id,{status:'queued',progress:null});pump()}}
  container.remove=id=>{if(disabled)return;container.state.value=container.value.filter(item=>item.id!==id);emit()}
  container.pick=event=>{container.enqueue(event.target.files);event.target.value=''}
  container.drop=event=>{event.preventDefault();container.state.dragging=false;container.enqueue(event.dataTransfer?.files)}
  container.addEventListener('change',event=>{if(event.target!==container)event.stopImmediatePropagation()})
  DOMDisposer.add(container,()=>{removed=true;for(const controller of controllers.values())controller.abort();controllers.clear();files.clear()})
  container.accept=accept;container.disabled=disabled
},Util.makeDom(`
<div class="file-upload d-flex flex-column gap-3">
 <label class="border rounded p-3 d-flex flex-column gap-2" $class="this.state.dragging?'border-primary bg-body-tertiary':''" $ondragover="event.preventDefault();this.state.dragging=true" $ondragleave="this.state.dragging=false" $ondrop="this.drop(event)">
  <span slot-id="prompt">{#Choose files or drop them here#}</span>
  <input type="file" multiple class="form-control" aria-label="{#Choose files#}" $accept="this.accept" $disabled="this.disabled" $onchange="this.pick(event)">
 </label>
 <p class="text-danger mb-0" role="alert" $if="this.state.error" $text="this.state.error"></p>
 <ul class="list-group list-group-flush" aria-live="polite">
  <li class="list-group-item d-flex align-items-center gap-2 px-0" $each="this.state.jobs" as="job" key="id">
   <div class="flex-fill overflow-hidden"><span class="d-block text-truncate" $text="job.name"></span><small class="text-body-secondary" $if="job.status==='queued'">{#Queued#}</small><small class="text-body-secondary" $if="job.status==='uploading'&&job.progress==null">{#Uploading#}…</small><small class="text-danger" $if="job.status==='error'">{#Upload failed#}</small><progress class="w-100" max="100" $value="job.progress" $if="job.progress!=null" aria-label="{#Upload progress#}"></progress></div>
   <button type="button" class="btn btn-link" $if="job.status==='error'" $disabled="this.disabled" $onclick="this.retry(job.id)">{#Retry#}</button><button type="button" class="btn btn-link text-body-secondary" $onclick="this.cancel(job.id)" $aria-label="'{#Cancel#} '+job.name"><i class="bi bi-x-lg" aria-hidden="true"></i></button>
  </li>
  <li class="list-group-item d-flex align-items-center gap-2 px-0" $each="this.state.value" as="attachment" key="id"><div class="flex-fill overflow-hidden" slot-id="attachment"><span class="d-block text-truncate" $text="attachment.name"></span><small class="text-body-secondary" $text="Math.ceil((attachment.size||0)/1024)+' KB'"></small></div><button type="button" class="btn btn-link text-danger" $disabled="this.disabled" $onclick="this.remove(attachment.id)" $aria-label="'{#Remove#} '+attachment.name"><i class="bi bi-x" aria-hidden="true"></i></button></li>
 </ul>
</div>`))
