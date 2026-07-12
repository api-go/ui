/**
 * Resizer Component
 */
globalThis.Component.register('Resizer', container => {
        container.isVertical = container.hasAttribute('vertical')
        const min = parseInt(container.getAttribute('min')) || 10
        const max = parseInt(container.getAttribute('max')) || 1000
        const target = () => container.target || container.previousElementSibling
        container.addEventListener('bind', e => {
                if (e.detail !== undefined && e.detail !== null) {
                        target().style[container.isVertical ? 'height' : 'width'] = e.detail + 'px'
                }
        })
        const getSize = (startSize, w, h) => {
                const newSize = startSize + (container.isVertical ? h : w)
                return newSize < min ? min : newSize > max ? max : newSize
        }
        container.addEventListener('mousedown', event => {
                const element = target()
                const startSize = container.isVertical ? element.offsetHeight : element.offsetWidth
                globalThis.MouseMover.start(event, {
                        onmousemove: ({ w, h }) => {
                                const newSize = getSize(startSize, w, h)
                                element.style[container.isVertical ? 'height' : 'width'] = newSize + 'px'
                                container.dispatchEvent(new CustomEvent('resizing', { detail: { oldSize: startSize, newSize }, bubbles: false }))
                        },
                        onmouseup: ({ w, h }) => {
                                const newSize = getSize(startSize, w, h)
                                container.dispatchEvent(new CustomEvent('resize', { detail: { oldSize: startSize, newSize }, bubbles: false }))
                                container.dispatchEvent(new CustomEvent('change', { detail: newSize, bubbles: false }))
                        },
                })
        })
}, globalThis.Util.makeDom(/*html*/`
<div $class="border-\${this.isVertical?'top':'start'} flex-shrink-0" $style="\${this.isVertical?'height':'width'}:3px;\${!this.isVertical?'height':'width'}:100%;cursor:\${this.isVertical?'row-resize':'col-resize'}"></div>
`))
