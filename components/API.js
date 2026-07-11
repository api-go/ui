/**
 * API Component Module
 */
const APIComponent = globalThis.Component.register('API', container => {
        const presetRequest = container.request && typeof container.request === 'object' ? container.request : {}
        const presetResponse = container.response && typeof container.response === 'object' ? container.response : {}
        const presetResult = container.result && typeof container.result === 'object' ? container.result : {}

        container.request = globalThis.NewState({
                url: '',
                method: 'GET',
                headers: {},
                data: null,
                timeout: 10000,
                responseType: '',
                ...presetRequest,
                headers: { ...(presetRequest.headers || {}) }
        })
        container.response = globalThis.NewState({
                loading: false,
                ok: null,
                status: null,
                error: null,
                headers: {},
                responseType: '',
                result: null,
                ...presetResponse,
                headers: { ...(presetResponse.headers || {}) }
        })
        container.result = globalThis.NewState(presetResult)
        container.do = (opt = {}) => {
                return new Promise((resolve, reject) => {
                        const req = { ...container.request, ...opt }
                        if (!req.url) throw new Error('.url is required')
                        req.headers = { ...container.request.headers, ...opt.headers }
                        container.response.loading = true
                        globalThis.HTTP.request(req).then(resp => {
                                Object.keys(resp).forEach(k => { if (k !== 'result') container.response[k] = resp[k] })
                                if (resp.result && typeof resp.result === 'object' && container.result && typeof container.result === 'object') {
                                        Object.assign(container.result, resp.result)
                                } else {
                                        container.result = resp.result
                                }
                                container.response.loading = false
                                if (resp.ok === false) throw new Error(resp.error)
                                if (typeof resp.result === 'object' && resp.result.error) throw new Error(resp.result.error)
                                container.dispatchEvent(new CustomEvent('response', { detail: resp, bubbles: false }))
                                resolve(resp)
                        }).catch(err => {
                                if (!opt.noui) globalThis.Toast?.show(err.message, { type: 'danger' })
                                container.dispatchEvent(new CustomEvent('error', { detail: err, bubbles: true }))
                                reject(err)
                        })
                })
        }
        let _autoTimer = null
        container.request.__watch(null, () => {
                if (!container.hasAttribute('auto') || !container.request.url) return
                if (_autoTimer) return
                _autoTimer = Promise.resolve().then(() => {
                        container.do()
                        _autoTimer = null
                })
        })
})
