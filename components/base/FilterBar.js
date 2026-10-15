/** One host-owned query draft; apply/reset are explicit boundaries, not storage. */
Component.register('FilterBar', container => {
  container.state.query ??= NewState({})
  container.state.defaults ??= {}
  container.state.busy ??= false
  container.apply = () => {
    if (container.state.busy || !container.querySelector('form').reportValidity()) return false
    return container.dispatchEvent(new CustomEvent('apply', { detail:JSON.parse(JSON.stringify(container.state.query)), bubbles:false }))
  }
  container.reset = () => {
    if (container.state.busy) return false
    const query=container.state.query, defaults=JSON.parse(JSON.stringify(container.state.defaults))
    for (const key of new Set([...Object.keys(query),...Object.keys(defaults)])) query[key]=Object.hasOwn(defaults,key) ? defaults[key] : ''
    container.dispatchEvent(new CustomEvent('reset', { detail:{...query}, bubbles:false }))
    return container.apply()
  }
}, Util.makeDom(`
<div>
  <form class="d-flex flex-wrap align-items-end" role="search" aria-label="Filters" $onsubmit="event.preventDefault();event.stopPropagation();this.apply()">
    <fieldset $disabled="this.state.busy" class="d-flex flex-wrap align-items-end border-0 p-0 m-0" slot-id="fields"></fieldset>
    <div class="d-flex align-items-center">
      <button type="submit" class="btn btn-primary" $disabled="this.state.busy">{#Apply#}</button>
      <button type="button" class="btn btn-link" $disabled="this.state.busy" $onclick="this.reset()">{#Reset#}</button>
    </div>
    <div slot-id="end" class="d-flex flex-wrap align-items-center"></div>
  </form>
</div>`), Util.makeDom(`<style>
FilterBar {min-width:0;}
FilterBar form, FilterBar fieldset, FilterBar form > div {gap:var(--ui-gap,.5rem);min-width:0;}
FilterBar fieldset {flex:1 1 16rem;}
FilterBar fieldset > * {flex:1 1 10rem;min-width:0;}
</style>`))
