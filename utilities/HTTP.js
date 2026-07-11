/**
 * HTTP Module
 */
const HTTP = {
        get: ({ url, ...opt }) => HTTP.request({ url, method: 'GET', ...opt }),
        post: ({ url, data, ...opt }) => HTTP.request({ url, method: 'POST', data, ...opt }),
        put: ({ url, data, ...opt }) => HTTP.request({ url, method: 'PUT', data, ...opt }),
        delete: ({ url, ...opt }) => HTTP.request({ url, method: 'DELETE', ...opt }),
        head: ({ url, ...opt }) => HTTP.request({ url, method: 'HEAD', ...opt }),
        request: async ({ url, method = 'POST', data = undefined, headers = {}, responseType, timeout = 10000 }) => {
                method = method.toUpperCase()
                const options = { method, signal: AbortSignal.timeout?.(timeout) }
                if (data !== undefined && method !== 'GET' && method !== 'HEAD') {
                        if (data instanceof HTMLFormElement) data = new FormData(data)
                        if (data && typeof data === 'object' && !(data instanceof FormData) && !(data instanceof ArrayBuffer || ArrayBuffer.isView(data)) && Object.values(data).some(v => v instanceof File || v instanceof Blob || v instanceof FileList || (Array.isArray(v) && v.some(i => i instanceof File || i instanceof Blob)))) {
                                const fd = new FormData()
                                for (const [k, v] of Object.entries(data)) {
                                        if (v instanceof FileList || Array.isArray(v)) Array.from(v).forEach(item => fd.append(k, item))
                                        else if (v !== undefined && v !== null) fd.append(k, v)
                                }
                                data = fd
                        }
                        if (data instanceof FormData) {
                                delete headers['Content-Type']
                        } else if (typeof data !== 'string' && !(data instanceof ArrayBuffer || ArrayBuffer.isView(data))) {
                                data = JSON.stringify(data)
                                if (!headers['Content-Type']) headers['Content-Type'] = 'application/json'
                        }
                        options.body = data
                }
                for (const name of HTTP.keepHeaders) {
                        if (HTTP._keepHeadersCache[name] && !headers[name]) headers[name] = HTTP._keepHeadersCache[name]
                }
                if (Object.keys(headers).length) options.headers = headers
                const response = { error: null, ok: null, status: 0, headers: {}, responseType: '', result: null }
                try {
                        const resp = await fetch(url, options)
                        Object.assign(response, { ok: resp.ok, status: resp.status, headers: Object.fromEntries(resp.headers.entries()) })
                        for (const name of HTTP.keepHeaders) {
                                const val = resp.headers.get(name)
                                if (val) {
                                        HTTP._keepHeadersCache[name] = val
                                        try { localStorage.setItem('_http_keep_' + name, val); } catch (e) {}
                                }
                        }
                        if (!responseType) {
                                const contentType = resp.headers.get('Content-Type') || ''
                                if (contentType.includes('application/json')) responseType = 'json'
                                else if (/image|video|audio|pdf|zip|octet-stream/.test(contentType)) responseType = 'binary'
                                else responseType = 'text'
                                response.responseType = responseType
                        }
                        if (response.ok === false) response.error = (response.statusText || 'HTTP ' + response.status + ' error') + ' for ' + url
                        if (responseType === 'json') response.result = await resp.json()
                        else response.result = (responseType === 'binary') ? await resp.arrayBuffer() : await resp.text()
                } catch (err) {
                        Object.assign(response, { error: err.message || String(err), ok: false })
                }
                return response
        }
}

HTTP.keepHeaders = ['Session-Id', 'Device-Id'];
HTTP._keepHeadersCache = {};
for (const name of HTTP.keepHeaders) {
        try {
                const val = localStorage.getItem('_http_keep_' + name);
                if (val !== null) HTTP._keepHeadersCache[name] = val;
        } catch (e) {}
}

globalThis.HTTP = HTTP;
