# Filtered table workspace

Read AdminWorkspace.md, State.yaml, Pane.yaml and PageHeader.yaml. Use this for a read-only table with modest local data, not a replacement for DataGrid's virtual/remote protocol.

The toolbar remains fixed; Pane owns vertical scrolling and table-responsive owns horizontal overflow only when needed. Query identity belongs to Hash and restores on reload. Remote filtering additionally requires loading, empty, error/retry and request ordering according to the actual API. Do not cache an inexpensive filtered list in parallel state.

```html
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<script src="../frameworks/State.js"></script>
<script src="../frameworks/Bootstrap.js"></script>
<script src="../utilities/Disposer.js"></script>
<script src="../components/base/Pane.js"></script>
<script src="../components/base/PageHeader.js"></script>
<script src="../components/base/AppShell.js"></script>
</head><body class="m-0">
<script>
const orders_state=NewState({rows:Array.from({length:120},(_,i)=>({id:i,name:'Order '+i,amount:i*12.5}))})
</script>
<AppShell viewport>
  <span slot="header">Orders</span>
  <Pane slot="content">
    <PageHeader slot="header" heading="Orders" $.state.description="'Search and inspect confirmed orders.'"></PageHeader>
    <div slot="toolbar" class="d-flex flex-wrap align-items-center gap-2">
      <label for="orderQuery" class="form-label mb-0">Search orders</label>
      <input id="orderQuery" type="search" class="form-control" style="max-width:24rem" $bind="Hash.ordersQuery">
      <button class="btn btn-outline-secondary" $onclick="Hash.go({ordersQuery:null})">Reset</button>
    </div>
    <div slot="content" class="p-3">
      <p role="status" $if="!orders_state.rows.some(row=>row.name.toLowerCase().includes((Hash.ordersQuery||'').toLowerCase()))">No matching orders.</p>
      <div class="table-responsive">
        <table class="table align-middle mb-0">
          <thead><tr><th scope="col">Order</th><th scope="col" class="text-end">Amount (USD)</th></tr></thead>
          <tbody><tr $each="orders_state.rows.filter(row=>row.name.toLowerCase().includes((Hash.ordersQuery||'').toLowerCase()))" as="row" key="id"><th scope="row" $text="row.name"></th><td class="text-end" $text="row.amount.toFixed(2)"></td></tr></tbody>
        </table>
      </div>
    </div>
  </Pane>
</AppShell>
</body></html>
```

Acceptance: query filters rows and survives reload, Reset restores results, numbers align right, and 390px layout retains toolbar access without document scrolling.
