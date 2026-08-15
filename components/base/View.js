/**
 * View Component Module
 */
const viewFragmentLoads = new Map()
const viewExecutedScripts = new Set()

globalThis.Component.register('View', container => {
        const resolveFile = file => {
                const parentView = container.parentElement?.closest('view')
                return new URL(file, parentView?.fileURL || document.baseURI).href
        }

        const executeScripts = async scripts => {
                for (const oldScript of scripts) {
                        const source = oldScript.getAttribute('src')
                        const resolvedSource = source ? new URL(source, container.fileURL).href : ''
                        const scriptKey = resolvedSource ? `src:${resolvedSource}` : `inline:${oldScript.textContent}`
                        const duplicateDocumentScript = [...document.scripts].some(script => script !== oldScript && (
                                resolvedSource ? script.src === resolvedSource : !script.src && script.textContent === oldScript.textContent
                        ))
                        if (viewExecutedScripts.has(scriptKey) || duplicateDocumentScript) {
                                viewExecutedScripts.add(scriptKey)
                                oldScript.remove()
                                continue
                        }
                        const script = document.createElement('script')
                        Array.from(oldScript.attributes).forEach(attribute => script.setAttribute(attribute.name, attribute.value))
                        if (resolvedSource) script.src = resolvedSource
                        script.textContent = oldScript.textContent
                        const loaded = script.src ? new Promise((resolve, reject) => {
                                script.addEventListener('load', resolve, { once: true })
                                script.addEventListener('error', () => reject(new Error(`Failed to load View script: ${script.src}`)), { once: true })
                        }) : null
                        oldScript.replaceWith(script)
                        if (loaded) await loaded
                        viewExecutedScripts.add(scriptKey)
                }
        }

        const loadFragment = fileURL => {
                if (viewFragmentLoads.has(fileURL)) return viewFragmentLoads.get(fileURL)
                const loading = globalThis.HTTP.get({ url: fileURL, responseType: 'text' }).then(response => {
                        if (!response.ok) throw new Error(response.error || `Failed to load View: ${fileURL}`)
                        return response.result
                }).catch(error => {
                        viewFragmentLoads.delete(fileURL)
                        throw error
                })
                viewFragmentLoads.set(fileURL, loading)
                return loading
        }

        container.load = () => {
                if (container._loadPromise) return container._loadPromise
                const file = container.getAttribute('file')
                if (!file) return Promise.reject(new Error('View requires file="..."'))
                container.fileURL = resolveFile(file)
                container._loadPromise = loadFragment(container.fileURL).then(async result => {
                        const template = document.createElement('template')
                        template.innerHTML = result
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
