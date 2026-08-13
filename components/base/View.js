/**
 * View Component Module
 */
globalThis.Component.register('View', container => {
        const resolveFile = file => {
                const parentView = container.parentElement?.closest('view')
                return new URL(file, parentView?.fileURL || document.baseURI).href
        }

        const executeScripts = async scripts => {
                for (const oldScript of scripts) {
                        const duplicateInlineScript = !oldScript.src && [...document.scripts].some(script => script !== oldScript && !script.src && script.textContent === oldScript.textContent)
                        if (duplicateInlineScript) {
                                oldScript.remove()
                                continue
                        }
                        const script = document.createElement('script')
                        Array.from(oldScript.attributes).forEach(attribute => script.setAttribute(attribute.name, attribute.value))
                        if (script.src) script.src = new URL(script.getAttribute('src'), container.fileURL).href
                        script.textContent = oldScript.textContent
                        const loaded = script.src ? new Promise((resolve, reject) => {
                                script.addEventListener('load', resolve, { once: true })
                                script.addEventListener('error', () => reject(new Error(`Failed to load View script: ${script.src}`)), { once: true })
                        }) : null
                        oldScript.replaceWith(script)
                        if (loaded) await loaded
                }
        }

        container.load = () => {
                if (container._loadPromise) return container._loadPromise
                const file = container.getAttribute('file')
                if (!file) return Promise.reject(new Error('View requires file="..."'))
                container.fileURL = resolveFile(file)
                container._loadPromise = globalThis.HTTP.get({ url: container.fileURL, responseType: 'text' }).then(async response => {
                        if (!response.ok) throw new Error(response.error || `Failed to load View: ${container.fileURL}`)
                        const template = document.createElement('template')
                        template.innerHTML = response.result
                        const scripts = [...template.content.querySelectorAll('script')]
                        container.replaceChildren(template.content)
                        await executeScripts(scripts)
                        container.dispatchEvent(new CustomEvent('ready', { detail: { file: container.fileURL }, bubbles: false }))
                        return container
                }).catch(error => {
                        container._loadPromise = null
                        container.dispatchEvent(new CustomEvent('error', { detail: error, bubbles: false }))
                        throw error
                })
                return container._loadPromise
        }

        container.load().catch(error => console.error(error))
})
