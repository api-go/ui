/** Read lifecycle presentation; stale content stays mounted during refresh/errors. */
Component.register('RequestState', container => {
  container.state.loading ??= false
  container.state.error ??= ''
  container.state.empty ??= false
  container.state.hasdata ??= false
  container.retry = () => { if (!container.state.loading) container.dispatchEvent(new CustomEvent('retry', { bubbles:false })) }
}, Util.makeDom(`
<div class="d-flex flex-column" $aria-busy="this.state.loading?'true':'false'">
  <div $if="this.state.loading" role="status" class="p-3 text-body-secondary"><span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>{#Loading#}…</div>
  <div $if="!this.state.loading && this.state.error" role="alert" class="alert alert-danger m-3"><span $text="this.state.error"></span><button type="button" class="btn btn-link ms-2" $onclick="this.retry()">{#Retry#}</button></div>
  <div $if="!this.state.loading && !this.state.error && this.state.empty && !this.state.hasdata" role="status" class="p-3 text-body-secondary" slot-id="empty">{#No results#}</div>
  <div slot-id="content" data-request-content class="d-flex flex-column flex-fill" $.hidden="!this.state.hasdata && (this.state.loading || !!this.state.error || this.state.empty)"></div>
</div>`), Util.makeDom(`<style>RequestState, RequestState > [data-request-content] {min-width:0;min-height:0;} RequestState > [hidden] {display:none!important;}</style>`))
