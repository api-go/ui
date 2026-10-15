const fs=require('node:fs'),path=require('node:path'),YAML=require('yaml'),define=require('./contract-definition.cjs')
const root=path.join(__dirname,'..')
const walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(p,e.name)):[path.join(p,e.name)])
const contracts=()=>Object.fromEntries(['components','utilities','frameworks'].flatMap(d=>walk(path.join(root,d))).filter(p=>p.endsWith('.yaml')&&!p.endsWith('.test.yaml')).map(p=>[path.basename(p,'.yaml'),{file:p,...YAML.parse(fs.readFileSync(p,'utf8'))}]))
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;')
const render=(params)=>{
 const all=contracts(),name=params.get('name')||''
 const head='<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script src="/ui/frameworks/State.js"></script><script src="/ui/frameworks/Bootstrap.js"></script><script src="/ui/utilities/HTTP.js"></script>'
 const components=Object.values(all).filter(c=>c.kind==='component').sort((a,b)=>a.name.localeCompare(b.name))
 if(!name)return `<!doctype html><html><head>${head}<title>UI contract tests</title></head><body><main class="container py-4"><h1 class="h4">UI contract tests</h1><p>Open a component or a named case. These tests use isolated fixture data.</p><div class="list-group">${components.map(c=>`<a class="list-group-item list-group-item-action" href="?name=${c.name}">${c.name} · ${escape(c.purpose)}</a>`).join('')}</div></main></body></html>`
 if(!/^[A-Z]\w*$/.test(name)||!all[name])throw new Error('Unknown component')
 const contract=all[name],test=YAML.parse(fs.readFileSync(contract.file.replace(/\.yaml$/,'.test.yaml'),'utf8')),definition=define(name,contract,test,params.get('case')||'',params.get('geometry')==='1')
 const scripts=[],seen=new Set(['/ui/frameworks/State.js','/ui/frameworks/Bootstrap.js','/ui/utilities/HTTP.js']),names=new Set()
 const add=src=>{if(!/^\/ui\/[\w./-]+\.js$/.test(src)||src.split('/').includes('..'))throw new Error('Invalid test asset');if(!seen.has(src)){seen.add(src);scripts.push(src)}}
 const load=n=>{if(n.startsWith('/')){add(n);return}if(names.has(n))return;names.add(n);const c=all[n];if(!c)throw new Error('Missing dependency '+n);for(const dep of c.dependencies||[])load(dep);add(c.src||c.reference?.source)}
 load(name);for(const dep of test.dependencies||[])load(dep)
 const nav=test.cases.map((c,i)=>`<a class="list-group-item list-group-item-action" data-test-case="${escape(c.name)}" href="?name=${name}&case=${i}">${escape(c.name)}</a>`).join('')
 return `<!doctype html><html class="h-100"><head>${head}<title>${name} contract</title>${scripts.map(src=>`<script src="${src}"></script>`).join('')}<script>globalThis.__componentTestDefinition=${JSON.stringify(definition).replaceAll('<','\\u003c')}</script></head><body class="h-100 m-0"><main class="h-100 d-flex flex-column gap-2 p-3 overflow-hidden"><header class="d-flex gap-2 align-items-center"><a class="btn btn-link" href="check">Components</a><h1 class="h5 m-0">${name}</h1><a class="btn btn-link" href="?name=${name}">Run all</a></header><div class="d-flex gap-2 flex-fill overflow-hidden"><nav class="d-none d-lg-block overflow-auto flex-shrink-0" style="width:18rem">${nav}</nav><div class="d-flex flex-column flex-fill overflow-hidden"><section id="componentTestFixture" class="flex-fill overflow-auto border rounded p-3"></section><div id="componentTestSummary" class="alert alert-secondary mb-0">Loading</div><pre id="componentTestOutput" class="overflow-auto m-0" style="max-height:8rem"></pre><details><summary>Structured result</summary><pre id="componentTestResult" class="overflow-auto" style="max-height:8rem"></pre></details></div></div></main><script src="/ui/tools/contract-runner.js"></script></body></html>`
}
module.exports={render,contracts}
