const {spawn}=require('node:child_process'),net=require('node:net'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright'),{contracts}=require('./contract-page.cjs'),probe=require('./density-probe.cjs')
const port=()=>new Promise(r=>{const server=net.createServer();server.listen(0,'127.0.0.1',()=>{const p=server.address().port;server.close(()=>r(p))})})
;(async()=>{
 const p=await port(),base=`http://127.0.0.1:${p}`,server=spawn(process.execPath,[path.join(__dirname,'serve.cjs')],{env:{...process.env,PORT:String(p)},stdio:'inherit'});let browser
 try{
  for(let i=0;i<100;i++){try{if((await fetch(base+'/ui/ui.js')).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
  browser=await chromium.launch({headless:true});const results=[]
  const jobs=Object.values(contracts()).filter(c=>c.kind==='component').flatMap(c=>[1280,390].flatMap(width=>['lg','sm'].map(density=>({name:c.name,width,density}))))
  async function worker(){while(jobs.length){const job=jobs.shift(),context=await browser.newContext({viewport:{width:job.width,height:1000}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message))
   try{
    await page.addInitScript(probe,job.density);await page.goto(base+'/ui/tools/check?name='+job.name+'&geometry=1');await page.waitForFunction(()=>['passed','failed','error'].includes(document.body.dataset.testStatus),{},{timeout:130000})
    if(job.name==='Dialog')await page.evaluate(async()=>{const p=Dialog.show({message:'Density geometry',buttons:['Cancel','Confirm']}),d=[...document.querySelectorAll('Dialog')].at(-1);await new Promise(r=>d.addEventListener('shown.bs.modal',r,{once:true}));await __componentTestInspect(d,{name:'Dialog',caseName:'visible overlay',phase:'visual'});d.hide(true);await p})
    if(job.name==='Resizer')await page.evaluate(async()=>{const host=document.createElement('div');host.className='d-flex border';host.style.cssText='position:fixed;top:10rem;left:1rem;width:calc(100vw - 2rem);height:12rem';host.innerHTML='<div style="width:8rem"></div><Resizer></Resizer><div class="flex-fill"></div>';document.body.append(host);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));if(host.querySelector('Resizer').offsetHeight<100)throw Error('Empty splitter fixture');await __componentTestInspect(host,{name:'Resizer',caseName:'visible split',phase:'visual'});host.remove()})
    const data=await page.evaluate(()=>({result:__componentTestResult,findings:__densityFindings,captures:__densityCaptures}));assert.equal(data.result.status,'passed',JSON.stringify(data.result));assert.deepEqual(data.findings,[]);assert.deepEqual(errors,[])
    if(job.name!=='API')assert.ok(data.captures.reduce((n,c)=>n+c.measured+c.regions,0)>0,job.name+' no visible geometry')
    results.push({...job,passed:true,cases:data.result.cases.length,captures:data.captures.length,controls:data.captures.reduce((n,c)=>n+c.measured,0)});console.log(`PASS ${job.name} ${job.density} ${job.width}`)
   }catch(e){results.push({...job,passed:false,error:String(e.message)});console.error(`FAIL ${job.name} ${job.density} ${job.width}: ${e.message}`)}finally{await context.close()}
  }}
  await Promise.all(Array.from({length:3},worker))
  const output=path.join(__dirname,'../test-results/contracts.json');fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(results,null,2))
  const failed=results.filter(r=>!r.passed);console.log(`${results.length-failed.length}/${results.length} public density contracts passed`);assert.equal(failed.length,0)
 }finally{await browser?.close();server.kill()}
})().catch(e=>{console.error(e);process.exitCode=1})
