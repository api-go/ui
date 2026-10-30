/** Local date browsing, no timezone conversion, booking rules or persistence. */
Component.register('Calendar',container=>{
  const today=()=>format(new Date()),format=date=>date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0')
  const parse=value=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return null;const date=new Date(value+'T12:00:00');return !isNaN(date)&&format(date)===value?date:null}
  const shift=(value,days)=>{const date=parse(value);date.setDate(date.getDate()+days);return format(date)}
  container.state=NewState({value:today(),mode:'month',events:[]})
  Object.defineProperty(container,'value',{get:()=>container.state.value,set:value=>{if(parse(value))container.state.value=value},configurable:true})
  Object.defineProperty(container,'mode',{get:()=>container.state.mode,set:value=>{container.state.mode=['month','week','day'].includes(value)?value:'month'},configurable:true})
  Object.defineProperty(container,'events',{get:()=>container.state.events,set:value=>{container.state.events=Array.isArray(value)?value.filter(event=>event&&event.id!=null&&parse(String(event.start||'').slice(0,10))).map(event=>({...event,id:String(event.id)})):[]},configurable:true})
  container.addEventListener('bind',event=>{container.value=event.detail})
  const notify=()=>container.dispatchEvent(new CustomEvent('rangechange',{detail:container.range()}))
  container.range=()=>{
    const date=parse(container.value),mode=container.mode
    if(mode==='day')return {start:container.value,end:shift(container.value,1),mode}
    if(mode==='week'){const start=shift(container.value,-(date.getDay()+6)%7);return {start,end:shift(start,7),mode}}
    date.setDate(1);const start=shift(format(date),-(date.getDay()+6)%7);return {start,end:shift(start,42),mode}
  }
  container.days=()=>{const range=container.range(),count=container.mode==='month'?42:container.mode==='week'?7:1;return Array.from({length:count},(_,index)=>shift(range.start,index))}
  container.dayEvents=date=>container.events.filter(event=>{const start=event.start.slice(0,10),end=String(event.end||event.start).slice(0,10);return start<=date&&(date<=end)&&(end!==date||!/T00:00(?::00(?:\.0+)?)?$/.test(String(event.end))||start===date)}).sort((a,b)=>a.start.localeCompare(b.start))
  container.select=date=>{if(!parse(date))return;container.value=date;container.dispatchEvent(new CustomEvent('change',{detail:date}));notify()}
  container.setMode=mode=>{container.mode=mode;container.dispatchEvent(new CustomEvent('modechange',{detail:container.mode}));notify()}
  container.move=direction=>{
    if(container.mode==='month'){const date=parse(container.value),day=date.getDate();date.setDate(1);date.setMonth(date.getMonth()+Number(direction));const last=new Date(date.getFullYear(),date.getMonth()+1,0).getDate();date.setDate(Math.min(day,last));container.select(format(date))}
    else container.select(shift(container.value,Number(direction)*(container.mode==='week'?7:1)))
  }
  container.today=()=>container.select(today())
  container.open=event=>container.dispatchEvent(new CustomEvent('eventclick',{detail:{...event}}))
  container.dateLabel=date=>new Intl.DateTimeFormat(undefined,{weekday:'short',month:'short',day:'numeric'}).format(parse(date))
  container.heading=()=>new Intl.DateTimeFormat(undefined,{year:'numeric',month:'long'}).format(parse(container.value))
  container.key=(event,date)=>{const amount={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7}[event.key];if(amount){event.preventDefault();const next=shift(date,amount);container.select(next);setTimeout(()=>[...container.querySelectorAll('[data-calendar-date]')].find(button=>button.dataset.calendarDate===next)?.focus(),0)}}
},Util.makeDom(`
<div class="calendar d-flex flex-column gap-3">
 <div class="ui-toolbar px-0 d-flex flex-wrap align-items-center gap-2">
  <strong class="me-auto" aria-live="polite" $text="this.heading()"></strong>
  <div class="d-flex align-items-center gap-1"><button type="button" class="btn btn-outline-secondary" aria-label="{#Previous period#}" $onclick="this.move(-1)"><i class="bi bi-chevron-left" aria-hidden="true"></i></button><button type="button" class="btn btn-outline-secondary" $onclick="this.today()">{#Today#}</button><button type="button" class="btn btn-outline-secondary" aria-label="{#Next period#}" $onclick="this.move(1)"><i class="bi bi-chevron-right" aria-hidden="true"></i></button></div>
  <label><span class="visually-hidden">{#Calendar view#}</span><select class="form-select" aria-label="{#Calendar view#}" $.value="this.mode" $onchange="this.setMode(event.target.value)"><option value="month">{#Month#}</option><option value="week">{#Week#}</option><option value="day">{#Day#}</option></select></label><div slot-id="tools"></div>
 </div>
 <div class="calendar-month border rounded overflow-hidden" $if="this.mode==='month'">
  <div class="calendar-weekdays bg-body-tertiary text-body-secondary small text-center border-bottom"><span $each="this.days().slice(0,7)" as="date" $text="new Intl.DateTimeFormat(undefined,{weekday:'short'}).format(new Date(date+'T12:00:00'))"></span></div>
  <div class="calendar-days"><div class="calendar-day p-1 p-sm-2" $each="this.days()" as="date" key="date" $class="date.slice(0,7)!==this.value.slice(0,7)?'bg-body-tertiary':''">
   <button class="btn w-100 px-0 text-nowrap" type="button" $data-calendar-date="date" $class="date===this.value?'btn-primary':'btn-link text-body'" $aria-label="this.dateLabel(date)+' · '+this.dayEvents(date).length+' {#events#}'" $aria-pressed="date===this.value?'true':'false'" $onclick="this.select(date)" $onkeydown="this.key(event,date)"><span $text="Number(date.slice(-2))"></span><span class="d-sm-none" aria-hidden="true" $if="this.dayEvents(date).length">·</span></button>
   <div class="d-none d-sm-block"><button class="btn btn-link text-start text-truncate w-100 px-1 py-0" type="button" $each="this.dayEvents(date).slice(0,2)" as="entry" $text="entry.title||entry.id" $onclick="this.open(entry)"></button><small class="text-body-secondary" $if="this.dayEvents(date).length>2" $text="'+'+(this.dayEvents(date).length-2)"></small></div>
  </div></div>
 </div>
 <section $each="this.mode==='month'?[this.value]:this.days()" as="agendaDate" key="agendaDate"><h3 class="h6 text-body-secondary" $text="this.dateLabel(agendaDate)"></h3><ul class="list-group list-group-flush"><li class="list-group-item px-0" $each="this.dayEvents(agendaDate)" as="entry" key="id"><button class="btn btn-link text-start w-100 d-flex gap-3 px-0" type="button" $onclick="this.open(entry)"><span class="text-body-secondary text-nowrap" $text="entry.start.slice(11,16)||'{#All day#}'"></span><span class="text-break" slot-id="event"><strong class="d-block" $text="entry.title||entry.id"></strong><span class="small text-body-secondary" $text="entry.summary||''"></span></span></button></li></ul><p class="small text-body-secondary mb-0" $if="!this.dayEvents(agendaDate).length">{#No events#}</p></section>
</div>`),Util.makeDom(`<style>
Calendar .calendar-weekdays,Calendar .calendar-days{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));}
Calendar .calendar-weekdays{padding-block:.5rem;}
Calendar .calendar-day{min-width:0;min-height:5rem;border-inline-end:1px solid var(--bs-border-color);border-bottom:1px solid var(--bs-border-color);}
Calendar .calendar-day:nth-child(7n){border-inline-end:0;}
Calendar .calendar-day:nth-last-child(-n+7){border-bottom:0;}
@media(max-width:575.98px){Calendar .calendar-day{min-height:3rem;}}
</style>`))
