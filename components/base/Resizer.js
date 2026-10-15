/**
 * Resizer Component
 */
globalThis.Component.register('Resizer', container => {
        container.isVertical = container.hasAttribute('vertical')
        const bounds = () => {
                const minimum = Number(container.getAttribute('min') ?? 10)
                const maximum = Number(container.getAttribute('max') ?? 1000)
                const min = Number.isFinite(minimum) && minimum >= 0 ? minimum : 10
                const max = Math.max(min, Number.isFinite(maximum) && maximum > 0 ? maximum : 1000)
                return { min, max }
        }
        const target = () => container.target || container.previousElementSibling
        const sizeKey = container.isVertical ? 'height' : 'width'
        const describe = size => {
                const { min, max } = bounds()
                container.setAttribute('aria-valuemin', String(min))
                container.setAttribute('aria-valuemax', String(max))
                container.setAttribute('aria-valuenow', String(size))
        }
        const apply = value => {
                if (!target() || !Number.isFinite(value)) return null
                const { min, max } = bounds(), size = Math.max(min, Math.min(max, value))
                target().style[sizeKey] = size + 'px'
                describe(size)
                return size
        }
        const finish = (oldSize, newSize) => {
                container.dispatchEvent(new CustomEvent('resize', { detail: { oldSize, newSize }, bubbles: false }))
                if (!container.hasAttribute('silent')) container.dispatchEvent(new CustomEvent('change', { detail: newSize, bubbles: false }))
        }
        container.setAttribute('role', 'separator')
        container.tabIndex = 0
        container.setAttribute('aria-orientation', container.isVertical ? 'horizontal' : 'vertical')
        if (!container.hasAttribute('aria-label')) container.setAttribute('aria-label', container.isVertical ? 'Resize height' : 'Resize width')
        container.addEventListener('focus', () => {
                if (target()) describe(target()[container.isVertical ? 'offsetHeight' : 'offsetWidth'])
        })
        container.addEventListener('bind', e => {
                if (e.detail !== undefined && e.detail !== null) {
                        apply(Number(e.detail))
                }
        })
        const getSize = (startSize, w, h) => {
                const { min, max } = bounds()
                const newSize = startSize + (container.isVertical ? h : w)
                return newSize < min ? min : newSize > max ? max : newSize
        }
        container.addEventListener('mousedown', event => {
			if (event.button !== 0 || !target()) return
			event.preventDefault()
			event.stopPropagation()
                const element = target()
                const startSize = container.isVertical ? element.offsetHeight : element.offsetWidth
                globalThis.MouseMover.start(event, {
                        onmousemove: ({ w, h }) => {
                                const newSize = getSize(startSize, w, h)
                                apply(newSize)
                                container.dispatchEvent(new CustomEvent('resizing', { detail: { oldSize: startSize, newSize }, bubbles: false }))
                        },
                        onmouseup: ({ w, h }) => {
                                const newSize = getSize(startSize, w, h)
                                apply(newSize)
                                finish(startSize, newSize)
                        },
                })
        })
        container.addEventListener('keydown', event => {
                if (!target()) return
                const keys = container.isVertical ? ['ArrowUp', 'ArrowDown'] : ['ArrowLeft', 'ArrowRight']
                if (![...keys, 'Home', 'End'].includes(event.key)) return
                event.preventDefault()
                const oldSize = target()[container.isVertical ? 'offsetHeight' : 'offsetWidth'], { min, max } = bounds()
                const step = event.shiftKey ? 40 : 10
                const newSize = apply(event.key === 'Home' ? min : event.key === 'End' ? max : oldSize + (event.key === keys[0] ? -step : step))
                container.dispatchEvent(new CustomEvent('resizing', { detail: { oldSize, newSize } }))
                finish(oldSize, newSize)
        })
        let pointer = null
        container.addEventListener('pointerdown', event => {
                if (event.pointerType === 'mouse' || event.button !== 0 || !target()) return
                event.preventDefault(); event.stopPropagation()
                pointer = { id:event.pointerId, x:event.clientX, y:event.clientY, size:target()[container.isVertical ? 'offsetHeight' : 'offsetWidth'] }
                container.setPointerCapture(event.pointerId)
        })
        container.addEventListener('pointermove', event => {
                if (!pointer || pointer.id !== event.pointerId) return
                const newSize = apply(getSize(pointer.size, event.clientX-pointer.x, event.clientY-pointer.y))
                container.dispatchEvent(new CustomEvent('resizing', { detail: { oldSize:pointer.size, newSize } }))
        })
        container.addEventListener('pointerup', event => {
                if (!pointer || pointer.id !== event.pointerId) return
                const oldSize = pointer.size, newSize = apply(getSize(oldSize, event.clientX-pointer.x, event.clientY-pointer.y))
                pointer = null; container.releasePointerCapture(event.pointerId); finish(oldSize, newSize)
        })
        const cancelPointer = () => {
                if (!pointer) return
                const id = pointer.id
                apply(pointer.size); pointer = null
                if (container.hasPointerCapture(id)) container.releasePointerCapture(id)
        }
        container.addEventListener('pointercancel', cancelPointer)
        container.addEventListener('lostpointercapture', cancelPointer)
		container.addEventListener('dragstart', event => { event.preventDefault(); event.stopPropagation() })
}, globalThis.Util.makeDom(/*html*/`
<div class="flex-shrink-0" draggable="false" $style="\${this.isVertical?'height':'width'}:9px;\${!this.isVertical?'height':'width'}:100%;cursor:\${this.isVertical?'row-resize':'col-resize'};user-select:none;touch-action:none;background:linear-gradient(\${this.isVertical?'to bottom':'to right'}, transparent 0, transparent 4px, var(--bs-border-color) 4px, var(--bs-border-color) 5px, transparent 5px)"></div>
`))
