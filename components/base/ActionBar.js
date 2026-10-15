/** Host-owned commands. Primary actions stay visible; secondary commands use a
 * menu in narrow containers. No persistence or permission decisions live here. */
Component.register('ActionBar', container => {
  container.state.actions ??= []
  container.state.selection ??= []
  container.state.busy ??= false
  container.run = id => {
    const action = container.state.actions.find(item => item.id === id)
    if (!action || action.disabled || container.state.busy) return false
    return container.dispatchEvent(new CustomEvent('action', { detail:{ id, selection:[...container.state.selection] }, bubbles:false }))
  }
}, Util.makeDom(`
<div role="group" aria-label="Actions" class="d-flex flex-wrap align-items-center">
  <div slot-id="start" class="d-flex flex-wrap align-items-center"></div>
  <span $if="this.state.selection.length" class="text-body-secondary" role="status" $text="this.state.selection.length+' {#selected#}'"></span>
  <div class="action-bar-primary d-flex flex-wrap align-items-center">
    <button $each="this.state.actions.filter(action=>action.primary)" as="action" type="button" $class="'btn '+(action.danger?'btn-danger':'btn-primary')" $disabled="this.state.busy || action.disabled" $onclick="this.run(action.id)"><i $if="action.icon" $class="'bi bi-'+action.icon" aria-hidden="true"></i><span $text="action.label"></span></button>
  </div>
  <div class="action-bar-secondary align-items-center flex-wrap">
    <button $each="this.state.actions.filter(action=>!action.primary)" as="action" type="button" $class="'btn '+(action.danger?'btn-link text-danger':'btn-link')" $disabled="this.state.busy || action.disabled" $onclick="this.run(action.id)"><i $if="action.icon" $class="'bi bi-'+action.icon" aria-hidden="true"></i><span $text="action.label"></span></button>
  </div>
  <div class="action-bar-more dropdown" $if="this.state.actions.some(action=>!action.primary)">
    <button type="button" class="btn btn-link dropdown-toggle" data-bs-toggle="dropdown" aria-label="More actions" $disabled="this.state.busy">{#More#}</button>
    <div class="dropdown-menu dropdown-menu-end">
      <button $each="this.state.actions.filter(action=>!action.primary)" as="action" type="button" class="dropdown-item" $class="action.danger?'text-danger':''" $disabled="this.state.busy || action.disabled" $onclick="this.run(action.id)" $text="action.label"></button>
    </div>
  </div>
  <div slot-id="end" class="d-flex flex-wrap align-items-center"></div>
</div>`), Util.makeDom(`<style>
ActionBar {container-type:inline-size;gap:var(--ui-gap,.5rem);min-width:0;}
ActionBar > div, ActionBar button {gap:var(--ui-gap,.5rem);}
ActionBar .action-bar-primary {margin-inline-start:auto;}
ActionBar .action-bar-secondary {display:flex;}
ActionBar .action-bar-more {display:none;}
@container(max-width:36rem) { ActionBar .action-bar-secondary {display:none;} ActionBar .action-bar-more {display:block;} }
</style>`))
