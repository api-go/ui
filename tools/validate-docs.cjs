const fs=require('node:fs'),path=require('node:path'),YAML=require('yaml'),{contracts}=require('./contract-page.cjs'),define=require('./contract-definition.cjs')
const root=path.join(__dirname,'..')
async function validateDocs(){
 const all=contracts(),llms=fs.readFileSync(path.join(root,'llms.txt'),'utf8'),ui=fs.readFileSync(path.join(root,'ui.js'),'utf8'),pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'))),errors=[]
 const links=[...llms.matchAll(/\]\(([^)]+)\)/g)].map(m=>m[1]).filter(s=>!/^\w+:/.test(s))
 for(const link of links)if(!fs.existsSync(path.resolve(root,link.split(/[?#]/)[0])))errors.push('Missing llms link '+link)
 const implemented=[...ui.matchAll(/^    (\w+): \{ path: '(components\/[^']+)\.js'/gm)].map(m=>[m[1],m[2]+'.yaml'])
 for(const [name,p]of implemented)if(!links.includes(p))errors.push('Missing component index '+name)
 for(const c of Object.values(all)){
  if(!c.name||!c.purpose||path.basename(c.file)!==c.name+'.yaml')errors.push('Invalid contract '+c.file)
  if(c.src||c.reference?.source){const p=(c.src||c.reference.source).replace(/^\/ui\//,'');if(!fs.existsSync(path.join(root,p)))errors.push('Missing asset '+p)}
  for(const key of ['related','tests'])for(const p of c[key]||[])if(!/^\w+:/.test(p)&&!fs.existsSync(path.resolve(path.dirname(c.file),p)))errors.push('Missing reference '+c.name+' '+p)
  if(c.kind==='component'){
   const p=c.file.replace(/\.yaml$/,'.test.yaml');if(!fs.existsSync(p)){errors.push('Missing test '+c.name);continue}
   const test=YAML.parse(fs.readFileSync(p,'utf8')),d=define(c.name,c,test)
   if(!test.cases?.length)errors.push('Empty test '+c.name)
   if(d.coverage.missing.length||d.coverage.unknown.length)errors.push(c.name+' coverage '+JSON.stringify(d.coverage))
  }
 }
 const versions=[...llms.matchAll(/@api-go\/ui@([^/"\s]+)/g)].map(m=>m[1]);if(!versions.length||versions.some(v=>v!==pkg.version))errors.push('llms version mismatch')
 if(errors.length)throw new Error(errors.join('\n'))
 console.log(`Validated ${Object.keys(all).length} contracts and ${implemented.length} public components`)
}
if(require.main===module)validateDocs().catch(e=>{console.error(e);process.exit(1)})
module.exports={validateDocs}
