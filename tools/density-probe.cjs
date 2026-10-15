// Same DOM probe used by master component-density checks.
module.exports=(initialDensity)=>{
    const findings=[];const captures=[]
    ;(window).__densityFindings=findings;(window).__densityCaptures=captures
    const frames=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())))
    ;(window).__componentTestInspect=async(subject,context)=>{
      for(const density of (context.phase.startsWith('action-')?[initialDensity]:[initialDensity==='lg'?'sm':'lg',initialDensity])){
        if (!context.phase.startsWith('action-')) {document.documentElement.classList.remove('ui-default','ui-sm','ui-lg');document.documentElement.classList.add('ui-'+density);await frames()}
        const roots=[subject,...document.querySelectorAll('.modal.show,.offcanvas.show,.toast.show')]
        const nodes=[...new Set(roots.flatMap(root=>[root,...root.querySelectorAll('button,input,select,textarea,.form-control,.input-group-text')]))]
        const visible=(node)=>{
          if(!node.isConnected||node.closest('[hidden],[inert],.showing,.collapsing'))return false
          const rect=node.getBoundingClientRect(),css=getComputedStyle(node)
          if(css.display==='none'||css.visibility==='hidden'||rect.width<=0||rect.height<=0)return false
          let left=Math.max(0,rect.left),right=Math.min(innerWidth,rect.right),top=Math.max(0,rect.top),bottom=Math.min(innerHeight,rect.bottom)
          let fixedRoot=null;for(let p=node;p;p=p.parentElement)if(getComputedStyle(p).position==='fixed'){fixedRoot=p;break}
          for(let p=node.parentElement;p&&p!==fixedRoot?.parentElement;p=p.parentElement){const s=getComputedStyle(p),r=p.getBoundingClientRect();if(s.overflowX!=='visible'){left=Math.max(left,r.left);right=Math.min(right,r.right)}if(s.overflowY!=='visible'){top=Math.max(top,r.top);bottom=Math.min(bottom,r.bottom)}}
          return right-left>2&&bottom-top>2
        }
        let measured=0
        const problems=[]
        for(const node of nodes){
          if(!visible(node))continue
          const rect=node.getBoundingClientRect(),css=getComputedStyle(node),tag=node.tagName.toLowerCase()
          if(!['button','input','select','textarea'].includes(tag)&&!node.classList.contains('form-control'))continue
          measured++
          const record=(kind,detail)=>problems.push({...context,density,kind,tag,classes:node.className,detail})
          if(!Number.isFinite(rect.width)||!Number.isFinite(rect.height)||rect.width<2||rect.height<2)record('invalid-control-box',{width:rect.width,height:rect.height})
          const icon=node.querySelector('i.bi')
          if(tag==='button'&&icon&&visible(icon)){
            const ir=icon.getBoundingClientRect()
            if(ir.left<rect.left-1||ir.right>rect.right+1||ir.top<rect.top-1||ir.bottom>rect.bottom+1)record('icon-outside-button',{button:{x:rect.x,y:rect.y,w:rect.width,h:rect.height},icon:{x:ir.x,y:ir.y,w:ir.width,h:ir.height}})
            if(!node.textContent?.trim()&&!node.classList.contains('dropdown-toggle')&&getComputedStyle(icon).position!=='absolute'){
              const tolerance=Math.max(2.5,parseFloat(css.fontSize)*.2)
              if(Math.abs(ir.x+ir.width/2-rect.x-rect.width/2)>tolerance||Math.abs(ir.y+ir.height/2-rect.y-rect.height/2)>tolerance)record('icon-not-centered',{dx:ir.x+ir.width/2-rect.x-rect.width/2,dy:ir.y+ir.height/2-rect.y-rect.height/2})
            }
          }
          const nativeText=(tag==='button'&&!node.classList.contains('btn-close'))||tag==='select'||(tag==='input'&&!['checkbox','radio','range','color','file','hidden'].includes((node).type))
          if(nativeText&&css.position!=='absolute'){
            const scaleY=rect.height/(node.offsetHeight||rect.height)
            const children=[...node.children].filter(child=>getComputedStyle(child).position!=='absolute'&&getComputedStyle(child).display!=='none')
            const directText=[...node.childNodes].some(child=>child.nodeType===Node.TEXT_NODE&&child.textContent?.trim())
            const contentHeight=tag==='button'&&!directText&&children.length ? Math.max(...children.map(child=>child.getBoundingClientRect().height))/scaleY : (parseFloat(css.lineHeight)||parseFloat(css.fontSize)*1.2)
            const needed=(contentHeight+parseFloat(css.paddingTop)+parseFloat(css.paddingBottom)+parseFloat(css.borderTopWidth)+parseFloat(css.borderBottomWidth))*scaleY
            if(rect.height+1<needed)record('control-content-clipped',{height:rect.height,needed})
          }
        }
        for(const compose of subject.querySelectorAll('.item-collection-compose')){
          if(!visible(compose))continue
          const add=compose.querySelector('.item-collection-add'),creator=compose.querySelector('.item-collection-creator')
          if(add&&creator){const a=add.getBoundingClientRect(),c=creator.getBoundingClientRect();if(Math.abs(a.y+a.height/2-c.y-c.height/2)>1.5)problems.push({...context,density,kind:'collection-add-misaligned',detail:{add:a.toJSON(),creator:c.toJSON()}})}
        }
        for(const chrome of subject.querySelectorAll('.ai-chat-toolbar,.doc-toolbar-shell,.doc-topbar,.card-grid-toolbar,.dt-toolbar,.code-editor-toolbar,.item-collection-compose,.item-collection-item,.item-collection-creator,.input-group,[data-shell-header],[data-pane-toolbar],[data-pane-footer]')){
          if(!visible(chrome))continue
          const css=getComputedStyle(chrome)
          if(!['auto','scroll'].includes(css.overflowX)&&chrome.scrollWidth>chrome.clientWidth+2)problems.push({...context,density,kind:'toolbar-content-overflow',classes:chrome.className,detail:{scrollWidth:chrome.scrollWidth,clientWidth:chrome.clientWidth}})
        }
        const regions=[subject,...subject.querySelectorAll('canvas,svg,iframe,img,Resizer,[role=separator],[data-pane-header],[data-pane-content],[data-pane-toolbar],[data-pane-footer],[data-shell-header],[data-page-actions],.list-group-item,.dt-row,.code-editor-toolbar,.doc-toolbar-shell,.item-collection-compose')].filter(visible)
        const boxes=regions.slice(0,40).map(node=>{const r=node.getBoundingClientRect(),css=getComputedStyle(node);return {tag:node.tagName,classes:node.className?.toString(),x:r.x,y:r.y,width:r.width,height:r.height,scrollWidth:node.scrollWidth,clientWidth:node.clientWidth,overflow:css.overflow}})
        captures.push({...context,density,measured,regions:regions.length,boxes})
        findings.push(...problems)
      }
    }
  }
