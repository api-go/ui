/** Image inspection only; hosts provide authorized URLs and own upload/storage.
 * Native .src binding deliberately retains the Image load/error lifecycle;
 * automatic SVG inlining is for decorative markup, not an interactive viewer.
 */
Component.register('ImageViewer',container=>{
  const initial=container.images||[]
  container.state=NewState({images:initial,index:0,zoom:1,x:0,y:0,loading:true,error:false,open:false})
  const modal=container.querySelector('Modal')
  let disposed=false,pointer=null
  const reset=()=>{container.state.zoom=1;container.state.x=0;container.state.y=0;container.state.loading=true;container.state.error=false}
  Object.defineProperty(container,'images',{get:()=>container.state.images,set:value=>{container.state.images=Array.isArray(value)?value:[];container.state.index=Math.min(container.state.index,Math.max(0,container.state.images.length-1));reset();if(!container.state.images.length)container.hide()},configurable:true})
  container.current=()=>{const item=container.state.images[container.state.index];return typeof item==='string'?{src:item,alt:''}:item||{src:'',alt:''}}
  container.select=index=>{
    const next=Number(index);if(!Number.isInteger(next)||next<0||next>=container.images.length)return false
    if(next!==container.state.index){container.state.index=next;reset();container.dispatchEvent(new CustomEvent('change',{detail:next}))}return true
  }
  Object.defineProperty(container,'value',{get:()=>container.state.index,set:value=>{const next=Number(value);if(Number.isInteger(next)&&next>=0&&next<container.images.length){container.state.index=next;reset()}},configurable:true})
  container.addEventListener('bind',event=>{container.value=event.detail})
  container.show=(index=container.state.index)=>{if(disposed||!container.images.length||container.state.open)return false;container.select(index);container.state.open=true;modal.show();return true}
  container.hide=()=>modal.hide(true)
  container.next=()=>container.select(container.state.index+1)
  container.previous=()=>container.select(container.state.index-1)
  container.zoom=delta=>{container.state.zoom=Math.min(5,Math.max(1,Math.round((container.state.zoom+Number(delta))*100)/100));if(container.state.zoom===1){container.state.x=0;container.state.y=0}}
  container.reset=()=>{container.state.zoom=1;container.state.x=0;container.state.y=0}
  container.retry=()=>{container.state.error=false;container.state.loading=true;container.state.retry=(container.state.retry||0)+1}
  container.src=()=>{const src=String(container.current().src||'');return src}
  container.key=event=>{
    if(!container.state.open||event.altKey||event.ctrlKey||event.metaKey||event.target?.matches('input,textarea,select'))return
    if(event.key==='ArrowRight'){event.preventDefault();container.next()}else if(event.key==='ArrowLeft'){event.preventDefault();container.previous()}else if(['+','='].includes(event.key)){event.preventDefault();container.zoom(.25)}else if(event.key==='-'){event.preventDefault();container.zoom(-.25)}else if(event.key==='0'){event.preventDefault();container.reset()}
  }
  container.panStart=event=>{if(container.state.zoom<=1||event.button!==0)return;pointer={id:event.pointerId,x:event.clientX,y:event.clientY,startX:container.state.x,startY:container.state.y};event.currentTarget.setPointerCapture(event.pointerId);event.preventDefault()}
  container.pan=event=>{if(!pointer||event.pointerId!==pointer.id)return;const rect=event.currentTarget.getBoundingClientRect(),limitX=rect.width*(container.state.zoom-1)/2,limitY=rect.height*(container.state.zoom-1)/2;container.state.x=Math.min(limitX,Math.max(-limitX,pointer.startX+event.clientX-pointer.x));container.state.y=Math.min(limitY,Math.max(-limitY,pointer.startY+event.clientY-pointer.y))}
  container.panEnd=()=>{pointer=null}
  modal.addEventListener('keydown',container.key)
  modal.addEventListener('change',event=>{if(event.target===modal&&event.detail===false){container.state.open=false;pointer=null}})
  DOMDisposer.add(container,()=>{disposed=true;pointer=null})
},Util.makeDom(`
<div class="image-viewer d-block" data-no-changebind>
 <button type="button" class="btn btn-outline-secondary" $disabled="!this.images.length" $onclick="this.show()"><i class="bi bi-arrows-fullscreen me-2" aria-hidden="true"></i><span slot-id="trigger">{#View images#}</span></button>
 <Modal data-no-changebind body-class="p-0" width="min(96vw,80rem)" max-width="80rem" body-height="65dvh" $.state.title="'{#Image preview#} · '+(this.state.index+1)+' / '+this.images.length" $.state.type="''">
  <div slot="body" class="image-viewer-stage position-relative h-100 overflow-hidden bg-body-tertiary d-flex align-items-center justify-content-center" $onpointerdown="thisNode.closest('ImageViewer').panStart(event)" $onpointermove="thisNode.closest('ImageViewer').pan(event)" $onpointerup="thisNode.closest('ImageViewer').panEnd()" $onpointercancel="thisNode.closest('ImageViewer').panEnd()">
   <div $if="thisNode.closest('ImageViewer').state.loading&&!thisNode.closest('ImageViewer').state.error" role="status" class="position-absolute top-50 start-50 translate-middle text-body-secondary">{#Loading#}…</div>
<template $if="thisNode.closest('ImageViewer').state.open&&!thisNode.closest('ImageViewer').state.error"><img class="mw-100 mh-100 object-fit-contain" draggable="false" $.src="thisNode.closest('ImageViewer').src()" $alt="thisNode.closest('ImageViewer').current().alt||''" $style="'transform:translate('+thisNode.closest('ImageViewer').state.x+'px,'+thisNode.closest('ImageViewer').state.y+'px) scale('+thisNode.closest('ImageViewer').state.zoom+')'" $onload="thisNode.closest('ImageViewer').state.loading=false" $onerror="thisNode.closest('ImageViewer').state.loading=false;thisNode.closest('ImageViewer').state.error=true"></template>
   <div class="text-center p-4" role="alert" $if="thisNode.closest('ImageViewer').state.error"><p>{#Unable to load this image.#}</p><button type="button" class="btn btn-outline-primary" $onclick="thisNode.closest('ImageViewer').retry()">{#Retry#}</button></div>
  </div>
  <div slot="footer" class="w-100 justify-content-center justify-content-sm-between">
   <div class="btn-group"><button type="button" class="btn btn-outline-secondary" aria-label="{#Previous image#}" $disabled="thisNode.closest('ImageViewer').state.index===0" $onclick="thisNode.closest('ImageViewer').previous()"><i class="bi bi-chevron-left" aria-hidden="true"></i></button><button type="button" class="btn btn-outline-secondary" aria-label="{#Next image#}" $disabled="thisNode.closest('ImageViewer').state.index>=thisNode.closest('ImageViewer').images.length-1" $onclick="thisNode.closest('ImageViewer').next()"><i class="bi bi-chevron-right" aria-hidden="true"></i></button></div>
   <div class="btn-group"><button type="button" class="btn btn-outline-secondary" aria-label="{#Zoom out#}" $disabled="thisNode.closest('ImageViewer').state.zoom<=1" $onclick="thisNode.closest('ImageViewer').zoom(-.25)"><i class="bi bi-dash-lg" aria-hidden="true"></i></button><button type="button" class="btn btn-outline-secondary" aria-label="{#Reset zoom#}" $onclick="thisNode.closest('ImageViewer').reset()" $text="Math.round(thisNode.closest('ImageViewer').state.zoom*100)+'%'"></button><button type="button" class="btn btn-outline-secondary" aria-label="{#Zoom in#}" $disabled="thisNode.closest('ImageViewer').state.zoom>=5" $onclick="thisNode.closest('ImageViewer').zoom(.25)"><i class="bi bi-plus-lg" aria-hidden="true"></i></button></div>
  </div>
 </Modal>
</div>`),Util.makeDom('<style>ImageViewer .image-viewer-stage {touch-action:none;} ImageViewer .image-viewer-stage img {user-select:none;}</style>'))
