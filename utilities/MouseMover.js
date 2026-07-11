/**
 * MouseMover Utility Module
 */
let _mouseMoverMoving = false
let _mouseMoverPos = {}
let _mouseMoverEvents = {}

const MouseMover = {
        start: (event, { onmousemove, onmouseup }) => {
                _mouseMoverPos = { x: event.clientX, y: event.clientY, w: 0, h: 0 }
                _mouseMoverEvents = { onmousemove, onmouseup }
                _mouseMoverMoving = true
        },
}

if (typeof document !== 'undefined') {
        document.addEventListener('mouseup', event => {
                if (!_mouseMoverMoving) return
                _mouseMoverMoving = false
                _mouseMoverEvents.onmouseup?.({ event, ..._mouseMoverPos })
        })
        document.addEventListener('mousemove', event => {
                if (!_mouseMoverMoving) return
                _mouseMoverPos.w = event.clientX - _mouseMoverPos.x
                _mouseMoverPos.h = event.clientY - _mouseMoverPos.y
                _mouseMoverEvents.onmousemove?.({ event, ..._mouseMoverPos })
        })
}

globalThis.MouseMover = MouseMover;
