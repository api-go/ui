/**
 * Declarative Chart.js component. The state.config shape is the native Chart.js config.
 */
globalThis.Component.register('Chart', container => {
  const canvas = container.querySelector('canvas')
  let instance = null
  const create = config => {
    instance?.destroy()
    const source = config && typeof config === 'object' ? config : { type: 'line', data: { labels: [], datasets: [] } }
    const originalClick = source.options?.onClick
    const originalHover = source.options?.onHover
    const chartConfig = {
      ...source,
      data: source.data || { labels: [], datasets: [] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        ...(source.options || {}),
        onClick(event, elements, chart) {
          originalClick?.call(this, event, elements, chart)
          container.dispatchEvent(new CustomEvent('chartclick', { detail: { event, elements, chart }, bubbles: false }))
        },
        onHover(event, elements, chart) {
          originalHover?.call(this, event, elements, chart)
          container.dispatchEvent(new CustomEvent('charthover', { detail: { event, elements, chart }, bubbles: false }))
        }
      }
    }
    instance = new globalThis.Chart(canvas, chartConfig)
    container.instance = instance
    return instance
  }
  container.update = (config, mode) => {
    if (config !== undefined) {
      container.state.config = config
      return container.instance
    }
    instance?.update(mode)
    return instance
  }
  container.resize = () => instance?.resize()
  container.destroy = () => { instance?.destroy(); instance = null; container.instance = null }
  container.state.__watch('config', create)
  create(container.state.config)
  globalThis.DOMDisposer.add(container, container.destroy)
}, globalThis.Util.makeDom(/*html*/`
<div class="chart-root position-relative w-100 h-100">
  <canvas></canvas>
</div>
`), globalThis.Util.makeDom(/*html*/`<style>
  Chart { display:block; min-height:240px; }
  Chart > .chart-root { min-height:inherit; }
</style>`))
