# Conversation history with a fixed composer

Read InteractiveApp.md, State.yaml and Pane.yaml. For the master Agent conversation protocol, use ChatBox.yaml instead; this generic local composition does not implement streaming, approvals, tools or server transport.

Pane owns history scrolling; the composer remains outside it. Each new local message scrolls its own public DOM node into view through a native scroll integration. No component internal DOM is queried. For incoming streams, use the owning component's follow-scroll contract and preserve the reader's position when they scroll away.

```html
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<script src="/ui/frameworks/State.js"></script>
<script src="/ui/frameworks/Bootstrap.js"></script>
<script src="/ui/utilities/Disposer.js"></script>
<script src="/ui/components/base/Pane.js"></script>
<script src="/ui/components/base/PageHeader.js"></script>
<script src="/ui/utilities/UUID.js"></script><script src="/ui/utilities/MouseMover.js"></script><script src="/ui/components/base/Resizer.js"></script><script src="/ui/components/base/SplitPane.js"></script><script src="/ui/components/base/AppShell.js"></script>
</head><body class="m-0">
<script>
const conversation_state=NewState({messages:Array.from({length:60},(_,i)=>({id:i,text:'Conversation entry '+i})),draft:'',nextID:60})
function appendMessage(event){
  event.preventDefault()
  const text=conversation_state.draft.trim()
  if(!text)return
  conversation_state.messages=[...conversation_state.messages,{id:conversation_state.nextID++,text}]
  conversation_state.draft=''
}
</script>
<AppShell viewport>
  <span slot="header">Conversation layout</span>
  <Pane slot="content">
    <PageHeader slot="header" heading="Conversation" $.state.description="'Local layout example; messages are not sent to a service.'"></PageHeader>
    <div slot="content" class="p-3 d-flex flex-column gap-3" role="log" aria-label="Conversation history" aria-live="polite">
      <article $each="conversation_state.messages" as="message" key="id" class="border rounded p-3" $onload="thisNode.scrollIntoView({block:'nearest'})">
        <h2 class="h6">Message</h2>
        <p class="mb-0 text-break" style="white-space:pre-wrap" $text="message.text"></p>
      </article>
    </div>
    <form slot="footer" class="d-flex flex-column gap-2" $onsubmit="appendMessage(event)">
      <label for="composer">Message draft</label>
      <textarea id="composer" class="form-control" rows="2" required $bind="conversation_state.draft"></textarea>
      <button type="submit" class="btn btn-primary align-self-end" $disabled="!conversation_state.draft.trim()">Add local message</button>
    </form>
  </Pane>
</AppShell>
</body></html>
```

Acceptance: long history scrolls inside the pane, the composer remains visible, blank messages cannot be added, and adding a message clears the draft and reveals the message without scrolling the document.
