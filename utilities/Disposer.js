/**
 * Internal component cleanup without the browser-reserved unload event.
 */
const DOMDisposer = (() => {
  const callbacks = new Map()
  let observer = null
  const flush = () => {
    for (const [element, handlers] of callbacks) {
      if (element.isConnected) continue
      callbacks.delete(element)
      handlers.forEach(handler => { try { handler() } catch (error) { console.error(error) } })
    }
    if (!callbacks.size) { observer?.disconnect(); observer = null }
  }
  return {
    add(element, handler) {
      if (!callbacks.has(element)) callbacks.set(element, new Set())
      callbacks.get(element).add(handler)
      if (!observer) { observer = new MutationObserver(flush); observer.observe(document.documentElement, { childList: true, subtree: true }) }
      return () => {
        const handlers = callbacks.get(element)
        handlers?.delete(handler)
        if (handlers && !handlers.size) callbacks.delete(element)
        if (!callbacks.size) { observer?.disconnect(); observer = null }
      }
    }
  }
})()

globalThis.DOMDisposer = DOMDisposer
