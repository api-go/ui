import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {runInNewContext} from 'node:vm'
const script=readFileSync(new URL('../utilities/ListDataSource.js',import.meta.url),'utf8')
function factory(){
  // A minimal notification fixture exercises this controller, not State internals.
  const NewState=values=>{const watches=new Map();const state=new Proxy(values,{set(target,key,value){if(target[key]===value)return true;target[key]=value;for(const fn of watches.get(key)||[])fn(value);return true}});Object.defineProperties(values,{__watch:{value:(key,fn)=>{if(!watches.has(key))watches.set(key,new Set());watches.get(key).add(fn)}},__unwatch:{value:(key,fn)=>watches.get(key)?.delete(fn)}});return state}
  const context={NewState,EventTarget,CustomEvent,AbortController,queueMicrotask};runInNewContext(script,context);return context.ListDataSource
}
const settle=()=>new Promise(resolve=>setImmediate(resolve))
test('local paging search sort size reset last-page recovery and disposal',async()=>{
  const source=factory().create({items:Array.from({length:35},(_,i)=>({id:i+1,name:'Record '+(i+1)})),pagesize:10})
  await source.ready;assert.equal(source.state.rows.length,10)
  source.setPage(3);await settle();assert.equal(source.state.rows[0].id,21)
  source.setQuery({search:'Record 2',sort:'-id'});await settle();assert.equal(source.state.page,1);assert.equal(source.state.rows[0].id,29)
  source.setPageSize(5);await settle();assert.equal(source.state.rows.length,5)
  assert.equal(source.setPage(0),false);assert.equal(source.setPageSize(0),false)
  source.setQuery({search:''});await settle();source.setPage(7);await settle();await source.setItems([{id:99,name:'Only'}]);await settle();assert.equal(source.state.page,1);assert.equal(source.state.rows[0].id,99)
  source.dispose();assert.equal(await source.reload(),false)
})
test('remote requests abort superseded reads, retain rows after failure and block late disposed results',async()=>{
  const pending=[];const source=factory().create({auto:false,errorMessage:'Read failed',load:(query,signal)=>new Promise((resolve,reject)=>pending.push({query,signal,resolve,reject}))})
  const first=source.reload(),second=source.reload();assert.equal(pending[0].signal.aborted,true)
  pending[1].resolve({rows:[{id:2}],total:1});await second;pending[0].resolve({rows:[{id:1}],total:1});await first;assert.equal(source.state.rows[0].id,2)
  const failed=source.reload();pending[2].reject(new Error('Private error'));await failed;assert.equal(source.state.error,'Read failed');assert.equal(source.state.rows[0].id,2)
  const invalid=source.reload();pending[3].resolve({rows:[],total:-1});await invalid;assert.equal(source.state.rows[0].id,2)
  const disposed=source.reload();source.dispose();pending[4].resolve({rows:[{id:3}],total:1});await disposed;assert.equal(source.state.rows[0].id,2)
})
test('schema filters combine keyword select numeric and date conditions, preserve zero and reset paging',async()=>{
  const fields=[{name:'status',type:'select'},{name:'min',field:'amount',type:'number',operator:'gte'},{name:'from',field:'date',type:'date',operator:'gte'},{name:'to',field:'date',type:'date',operator:'lte'}]
  const source=factory().create({filterfields:fields,pagesize:1,items:[{id:1,name:'Alpha',status:'open',amount:0,date:'2026-01-01'},{id:2,name:'Beta',status:'done',amount:25,date:'2026-02-01'},{id:3,name:'Alpha',status:'done',amount:50,date:'2026-03-01'}]})
  await source.ready;source.setPage(3);await settle()
  source.setQuery({search:'Beta',filters:{status:'done',min:0,from:'2026-02-01',to:'2026-02-28'}});await settle()
  assert.equal(source.state.page,1);assert.equal(source.state.total,1);assert.equal(source.state.rows[0].id,2);assert.equal(source.query().filters.min,0)
  const snapshot=source.query();snapshot.filters.status='changed';assert.equal(source.state.filters.status,'done')
  source.setQuery({search:'',filters:{status:'',min:'',from:null,to:undefined}});await settle();assert.equal(source.state.total,3);assert.equal(Object.keys(source.query().filters).length,0)
  source.dispose()
})
test('numeric equality compares values and excludes missing data',async()=>{
  const source=factory().create({items:[{id:1,amount:1},{id:2,amount:0},{id:3,amount:null}],filterfields:[{name:'amount',type:'number'}]})
  await source.ready;source.setQuery({filters:{amount:'1.0'}});await settle();assert.equal(source.state.rows[0].id,1)
  source.setQuery({filters:{amount:0}});await settle();assert.equal(source.state.total,1);assert.equal(source.state.rows[0].id,2)
  source.dispose()
})
