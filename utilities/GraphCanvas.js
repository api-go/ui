/**
 * Pan and zoom controller shared by graph-like editors.
 */
const GraphCanvas = (() => {
  const create = (container, scene, options = {}) => {
    if (!(container instanceof Element) || !(scene instanceof Element)) throw new TypeError('GraphCanvas.create requires container and scene Elements')
    const minScale = Number(options.minScale) || 0.2
    const maxScale = Number(options.maxScale) || 4
    const normalizedView = value => ({
      x: Number.isFinite(Number(value?.x)) ? Number(value.x) : 0,
      y: Number.isFinite(Number(value?.y)) ? Number(value.y) : 0,
      scale: Math.min(maxScale, Math.max(minScale, Number(value?.scale) || 1))
    })
    let view = normalizedView(options.view)
    const apply = emit => {
      scene.style.transformOrigin = '0 0'
      scene.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.scale})`
      if (emit) options.onChange?.({ ...view })
    }
    let pointerId = null, lastX = 0, lastY = 0
    const pointerDown = event => {
      if (event.button !== 0 || event.target.closest('[data-graph-node],button,input,textarea,select,a')) return
      pointerId = event.pointerId; lastX = event.clientX; lastY = event.clientY
      try { container.setPointerCapture?.(pointerId) } catch (_) {}
      container.classList.add('graph-panning')
    }
    const pointerMove = event => {
      if (pointerId !== event.pointerId) return
      view.x += event.clientX - lastX; view.y += event.clientY - lastY
      lastX = event.clientX; lastY = event.clientY; apply(true)
    }
    const pointerUp = event => {
      if (pointerId !== event.pointerId) return
      try { container.releasePointerCapture?.(pointerId) } catch (_) {}
      pointerId = null; container.classList.remove('graph-panning')
    }
    const wheel = event => {
      event.preventDefault()
      if (!event.ctrlKey && !event.metaKey) {
        view.x -= event.deltaX
        view.y -= event.deltaY
        apply(true)
        return
      }
      const rect = container.getBoundingClientRect()
      const pointX = event.clientX - rect.left, pointY = event.clientY - rect.top
      const next = Math.min(maxScale, Math.max(minScale, view.scale * (event.deltaY > 0 ? 0.9 : 1.1)))
      const ratio = next / view.scale
      view.x = pointX - (pointX - view.x) * ratio
      view.y = pointY - (pointY - view.y) * ratio
      view.scale = next; apply(true)
    }
    container.addEventListener('pointerdown', pointerDown)
    container.addEventListener('pointermove', pointerMove)
    container.addEventListener('pointerup', pointerUp)
    container.addEventListener('pointercancel', pointerUp)
    container.addEventListener('wheel', wheel, { passive: false })
    apply(false)
    const controller = {
      get view() { return { ...view } },
      setView(value, emit = false) { view = normalizedView({ ...view, ...(value || {}) }); apply(emit); return controller },
      toWorld(clientX, clientY) { const rect = container.getBoundingClientRect(); return { x: (clientX - rect.left - view.x) / view.scale, y: (clientY - rect.top - view.y) / view.scale } },
      fit(nodes = [], padding = 48) {
        if (!nodes.length || !container.clientWidth || !container.clientHeight) return controller
        const minX = Math.min(...nodes.map(node => node.x)), minY = Math.min(...nodes.map(node => node.y))
        const maxX = Math.max(...nodes.map(node => node.x + (node.width || 0))), maxY = Math.max(...nodes.map(node => node.y + (node.height || 0)))
        const width = Math.max(1, maxX - minX), height = Math.max(1, maxY - minY)
        const scale = Math.min(maxScale, Math.max(minScale, Math.min((container.clientWidth - padding * 2) / width, (container.clientHeight - padding * 2) / height)))
        return controller.setView({ scale, x: (container.clientWidth - width * scale) / 2 - minX * scale, y: (container.clientHeight - height * scale) / 2 - minY * scale }, true)
      },
      destroy() {
        container.removeEventListener('pointerdown', pointerDown); container.removeEventListener('pointermove', pointerMove)
        container.removeEventListener('pointerup', pointerUp); container.removeEventListener('pointercancel', pointerUp); container.removeEventListener('wheel', wheel)
      }
    }
    return controller
  }
  return { create }
})()

globalThis.GraphCanvas = GraphCanvas
