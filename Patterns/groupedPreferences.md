# Grouped preferences with an explicit save boundary

Read AdminWorkspace.md, State.yaml, AutoForm.yaml and its dependencies. This example intentionally owns browser preferences, so LocalStorage is the real persistence boundary. For server-owned data, replace the save adapter with the accepted API, await confirmation and preserve draft/dirty state on failure.

The single draft is bound to AutoForm. Schema dividers group fields. Native validation runs before submit; the fixed footer invokes AutoForm's public submit method. A storage failure stays visible and never clears the dirty source. The shared State runtime protects refresh while dirty.

```html
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<script src="/ui/frameworks/State.js"></script>
<script src="/ui/frameworks/Bootstrap.js"></script>
<script src="/ui/utilities/Disposer.js"></script>
<script src="/ui/utilities/UUID.js"></script>
<script src="/ui/components/base/Pane.js"></script>
<script src="/ui/components/base/PageHeader.js"></script>
<script src="/ui/utilities/MouseMover.js"></script><script src="/ui/components/base/Resizer.js"></script><script src="/ui/components/base/SplitPane.js"></script><script src="/ui/components/base/AppShell.js"></script>
<script src="/ui/components/base/Toast.js"></script>
<script src="/ui/components/base/AutoForm.js"></script>
</head><body class="m-0">
<script>
const preferenceSchema=[
  {name:'identity',type:'divider',label:'Display'},
  {name:'name',type:'text',label:'Display name',setting:{required:true}},
  {name:'density',type:'select',label:'Density',options:['Comfortable','Compact']},
  {name:'notifications',type:'divider',label:'Notifications'},
  {name:'email',type:'email',label:'Notification email'}
]
const preferences_state=NewState({draft:NewState({...{name:'Ada',density:'Comfortable',email:''},...LocalStorage.examplePreferences}),error:'',notice:''})
State.changes.Preferences=false
function savePreferences(event){
  event.preventDefault()
  preferences_state.error=''; preferences_state.notice=''
  try {
    LocalStorage.examplePreferences={...event.detail}
    State.changes.Preferences=false
    preferences_state.notice='Preferences saved in this browser.'
  } catch(error) { preferences_state.error='Could not save preferences. Your changes are retained.' }
}
</script>
<AppShell viewport>
  <span slot="header">Preferences</span>
  <Pane slot="content">
    <PageHeader slot="header" heading="Browser preferences" $.state.description="'These settings are stored only in this browser.'"></PageHeader>
    <div slot="content" class="p-3" data-changebind-scope .changebind="Preferences">
      <div class="alert alert-danger" role="alert" $if="preferences_state.error" $text="preferences_state.error"></div>
      <p role="status" $if="preferences_state.notice" $text="preferences_state.notice"></p>
      <AutoForm id="preferencesForm" nobutton $.state.data="preferences_state.draft" $.state.schema="preferenceSchema" $onsubmit="savePreferences(event)" style="max-width:48rem"></AutoForm>
    </div>
    <div slot="footer" class="d-flex justify-content-end">
      <button type="button" class="btn btn-primary" $disabled="!State.changes.Preferences" $onclick="preferencesForm.submit()">Save preferences</button>
    </div>
  </Pane>
</AppShell>
</body></html>
```

Acceptance: required fields validate; edits enable Save; successful save disables it and survives reload; storage failure preserves values, shows error and keeps Save enabled. Test wide/narrow layouts and both themes.
