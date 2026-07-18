/**
 * Small lifecycle wrapper around the embedded SortableJS library.
 */
const SortableAPI = (() => {
  const controllers = new WeakMap()
  const create = (element, options = {}) => {
    if (!(element instanceof Element)) throw new TypeError('SortableAPI.create requires an Element')
    controllers.get(element)?.destroy()
    const instance = globalThis.Sortable.create(element, options)
    let destroyed = false
    const controller = {
      element,
      instance,
      option(name, value) {
        if (arguments.length === 1) return instance.option(name)
        instance.option(name, value)
        return controller
      },
      enable() { instance.option('disabled', false); return controller },
      disable() { instance.option('disabled', true); return controller },
      destroy() {
        if (destroyed) return
        destroyed = true
        instance.destroy()
        if (controllers.get(element) === controller) controllers.delete(element)
      }
    }
    controllers.set(element, controller)
    return controller
  }
  return {
    create,
    get: element => controllers.get(element) || null,
    destroy(element) { controllers.get(element)?.destroy() }
  }
})()

globalThis.SortableAPI = SortableAPI
