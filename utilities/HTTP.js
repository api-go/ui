/**
 * HTTP Module
 */
const HTTP = {
        get: ({ url, ...opt }) => HTTP.request({ url, method: 'GET', ...opt }),
        post: ({ url, data, ...opt }) => HTTP.request({ url, method: 'POST', data, ...opt }),
        put: ({ url, data, ...opt }) => HTTP.request({ url, method: 'PUT', data, ...opt }),
        delete: ({ url, ...opt }) => HTTP.request({ url, method: 'DELETE', ...opt }),
        head: ({ url, ...opt }) => HTTP.request({ url, method: 'HEAD', ...opt }),
	request: async options => {
		// Snapshot defaults once, including across authentication recovery.
		if (!options._headersResolved) options = { ...options, headers: HTTP.requestHeaders(options.url, options.headers), _headersResolved: true }
		const response = await HTTP._request(options)
		if (![401, 403].includes(response.status)) return response
		// Release rejected streaming bodies, including the final permission denial.
		if (response.responseType === 'stream') await response.result?.cancel().catch(() => {})
		const recover = options.onUnauthorized || HTTP.onUnauthorized
		if (options.recoverUnauthorized === false || options._unauthorizedRetried || typeof recover !== 'function' || options.signal?.aborted) return response
		if (options.onUnauthorized) {
			let recovered = false
			try { recovered = await recover(response, options) } catch (_) {}
			if (!recovered || options.signal?.aborted) return response
			return HTTP.request({ ...options, _unauthorizedRetried: true })
		}
		if (!HTTP._unauthorizedRecovery) {
			HTTP._unauthorizedRecovery = Promise.resolve()
				.then(() => HTTP.onUnauthorized(response, options))
				.catch(() => false)
				.finally(() => { HTTP._unauthorizedRecovery = null })
		}
		if (!await HTTP._unauthorizedRecovery || options.signal?.aborted) return response
		return HTTP.request({ ...options, _unauthorizedRetried: true })
	},
	_request: async ({ url, method = 'POST', data = undefined, headers = {}, responseType, timeout = 10000, signal, credentials }) => {
		// Retained credentials must be read again after login, not frozen into the retry.
		headers = { ...headers }
		const sameOrigin = new URL(url, location.href).origin === new URL(location.href).origin
		method = method.toUpperCase()
		const timeoutSignal = timeout > 0 ? AbortSignal.timeout?.(timeout) : null
		const requestSignal = signal && timeoutSignal && AbortSignal.any ? AbortSignal.any([signal, timeoutSignal]) : (signal || timeoutSignal)
		const options = { method, ...(requestSignal ? { signal: requestSignal } : {}), ...(credentials ? { credentials } : {}) }
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
                                delete headers['content-type']
                        } else if (typeof data !== 'string' && !(data instanceof ArrayBuffer || ArrayBuffer.isView(data))) {
                                data = JSON.stringify(data)
                                if (!headers['Content-Type'] && !headers['content-type']) headers['Content-Type'] = 'application/json'
                        }
                        options.body = data
                }
                for (const name of sameOrigin ? HTTP.keepHeaders : []) {
                        if (HTTP._keepHeadersCache[name] && !Object.keys(headers).some(key => key.toLowerCase() === name.toLowerCase())) headers[name] = HTTP._keepHeadersCache[name]
                }
                if (Object.keys(headers).length) options.headers = headers
                const response = { error: null, ok: null, status: 0, headers: {}, responseType: '', result: null }
                try {
                        const resp = await fetch(url, options)
                        Object.assign(response, { ok: resp.ok, status: resp.status, headers: Object.fromEntries(resp.headers.entries()) })
                        for (const name of sameOrigin ? HTTP.keepHeaders : []) {
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
                        }
                        response.responseType = responseType
                        if (response.ok === false) response.error = (response.statusText || 'HTTP ' + response.status + ' error') + ' for ' + url
                        if (responseType === 'stream') response.result = resp.body
                        else if (responseType === 'json') response.result = await resp.json()
                        else response.result = (responseType === 'binary') ? await resp.arrayBuffer() : await resp.text()
                } catch (err) {
                        Object.assign(response, { error: err.message || String(err), ok: false })
                }
                return response
        }
}

HTTP.keepHeaders = ['Session-Id', 'Device-Id'];
// Page-local outbound defaults. Never persisted or updated by a response.
HTTP.globalHeaders = {};
HTTP.requestHeaders = (url, explicit = {}) => {
	const target = new URL(url, location.href);
	const protocol = target.protocol.replace(/^ws/, 'http');
	const sameOrigin = target.host === location.host && protocol === new URL(location.href).protocol;
	const result = new Headers(sameOrigin ? HTTP.globalHeaders : {});
	for (const [name, value] of new Headers(explicit)) result.set(name, value);
	return Object.fromEntries(result.entries());
};
// Native EventSource/WebSocket cannot set headers. Only outbound defaults are
// adapted; retained session/device headers and credentials never enter a URL.
HTTP.connectionURL = (url, headers = {}) => {
	const target = new URL(url, location.href);
	for (const [name, value] of Object.entries(HTTP.requestHeaders(url, headers))) {
		if (/^(authorization|proxy-authorization|cookie|set-cookie|session-id|device-id|x-api-key)$/i.test(name)) continue;
		if (!target.searchParams.has(name)) target.searchParams.set(name, value);
	}
	return target.href;
};
// Fetch exposes handshake status codes, so SSE shares HTTP authentication recovery.
// Keep the EventSource event/close interface used by existing application views.
HTTP.eventSource = (url, { headers = {}, withCredentials = false, recoverUnauthorized, onUnauthorized } = {}) => {
	const target = new URL(url, location.href).href, requestHeaders = HTTP.requestHeaders(url, headers)
	const source = new EventTarget(), controller = new AbortController()
	let retry = 3000, lastEventId = '', timer, activeReader, readyState = 0
	Object.defineProperties(source, {
		url: { value: target }, withCredentials: { value: withCredentials },
		readyState: { get: () => readyState },
		CONNECTING: { value: 0 }, OPEN: { value: 1 }, CLOSED: { value: 2 },
	})
	source.close = () => { readyState = 2; clearTimeout(timer); controller.abort(); activeReader?.cancel().catch(() => {}) }
	const emit = event => {
		source.dispatchEvent(event)
		if (typeof source[`on${event.type}`] === 'function') source[`on${event.type}`](event)
	}
	const connect = async () => {
		let terminal = false, reader, status = 0
		try {
			const response = await HTTP.request({ url: target, method: 'GET', headers: { ...requestHeaders, Accept: 'text/event-stream', ...(lastEventId ? { 'Last-Event-ID': lastEventId } : {}) },
				_headersResolved: true, responseType: 'stream', timeout: 0, signal: controller.signal,
				credentials: withCredentials ? 'include' : 'same-origin', recoverUnauthorized, onUnauthorized })
			if (controller.signal.aborted) return
			status = response.status
			terminal = [204, 401, 403].includes(response.status)
			if (!response.ok || !response.headers['content-type']?.toLowerCase().startsWith('text/event-stream') || !response.result?.getReader) {
				await response.result?.cancel().catch(() => {})
				if (response.status === 204) { source.close(); return }
				if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 429)) terminal = true
				throw new Error(response.error || 'Invalid event stream response')
			}
			readyState = 1; emit(new Event('open'))
			reader = activeReader = response.result.getReader()
			const decoder = new TextDecoder()
			let buffer = '', data = [], eventType = '', pendingId = lastEventId, skipLF = false
			const line = value => {
				if (!value) {
					lastEventId = pendingId
					if (data.length) emit(new MessageEvent(eventType || 'message', { data: data.join('\n'), lastEventId, origin: new URL(target).origin }))
					data = []; eventType = ''; return
				}
				if (value.startsWith(':')) return
				const colon = value.indexOf(':'), field = colon < 0 ? value : value.slice(0, colon)
				let content = colon < 0 ? '' : value.slice(colon + 1)
				if (content.startsWith(' ')) content = content.slice(1)
				if (field === 'data') data.push(content)
				else if (field === 'event') eventType = content
				else if (field === 'id' && !content.includes('\0')) pendingId = content
				else if (field === 'retry' && /^\d+$/.test(content)) retry = Math.min(Number(content), 2147483647)
			}
			while (!controller.signal.aborted) {
				const { done, value } = await reader.read()
				if (done) break
				for (const char of decoder.decode(value, { stream: true })) {
					if (skipLF) { skipLF = false; if (char === '\n') continue }
					if (char === '\r' || char === '\n') { line(buffer); buffer = ''; skipLF = char === '\r' }
					else buffer += char
					if (controller.signal.aborted) break
				}
			}
		} catch (_) { }
		finally { if (reader) { await reader.cancel().catch(() => {}); reader.releaseLock(); activeReader = null } }
		if (controller.signal.aborted) return
		if (terminal) source.close()
		else readyState = 0
		emit(Object.assign(new Event('error'), { status }))
		if (!controller.signal.aborted) timer = setTimeout(connect, retry)
	}
	// Allow handlers to be installed before the first connection settles.
	queueMicrotask(connect)
	return source
};
HTTP.webSocket = (url, { headers = {}, protocols } = {}) => new WebSocket(HTTP.connectionURL(url, headers), protocols);
HTTP.onUnauthorized = null;
HTTP._unauthorizedRecovery = null;
HTTP._keepHeadersCache = {};
for (const name of HTTP.keepHeaders) {
        try {
                const val = localStorage.getItem('_http_keep_' + name);
                if (val !== null) HTTP._keepHeadersCache[name] = val;
        } catch (e) {}
}

globalThis.HTTP = HTTP;
