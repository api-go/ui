// Browser protocol runner ported from master ui-check (apigo.component-test/v3).
(() => {
    const definition = globalThis.__componentTestDefinition || {}, output = document.getElementById('componentTestOutput'), summary = document.getElementById('componentTestSummary'), started = performance.now()
    let completed = false
    const coverage = definition.coverage || { required: [], declared: [], missing: [], unknown: [] }, resultCoverage = { required: coverage.required.length, covered: coverage.required.length - coverage.missing.length, missing: coverage.missing, unknown: coverage.unknown }
    const publish = result => {
      if (completed) return
      completed = true; clearTimeout(globalThis.__componentTestTimeout); globalThis.__componentTestResult = result
      document.getElementById('componentTestResult').textContent = JSON.stringify(result, null, 2); document.body.dataset.testStatus = result.status
      summary.textContent = `${result.status.toUpperCase()} · ${result.passed || 0} passed · ${result.failed || 0} failed · ${result.coverage?.covered || 0}/${result.coverage?.required || 0} exercised · ${result.duration || 0}ms`
      summary.className = `alert mb-0 py-2 ${result.status === 'passed' ? 'alert-success' : 'alert-danger'}`
      for (const link of document.querySelectorAll('[data-test-case]')) {
        const item = (result.cases || []).find(entry => entry.name === link.dataset.testCase)
        if (item) link.classList.add(item.ok ? 'text-success' : 'text-danger')
      }
      const uncovered = result.coverage?.missing?.length ? ['MISSING COVERAGE', ...result.coverage.missing.map(item => `  ${item}`)] : []
      output.textContent = [...uncovered, ...(result.cases || []).flatMap(item => [`${item.ok ? 'PASS' : 'FAIL'} ${item.name}`, ...(item.steps || []).filter(step => !step.ok).map(step => `  step ${step.index + 1}: ${step.error}`)])].join('\n')
      window.dispatchEvent(new CustomEvent('component-test-complete', { detail: result })); console.info(`[component-test] ${JSON.stringify(result)}`)
    }
    const fail = (status, error, cases = []) => publish({ protocol: definition.protocol || 'apigo.component-test/v3', name: definition.name || '', status, passed: cases.filter(item => item.ok).length, failed: Math.max(1, cases.filter(item => !item.ok).length), duration: Math.round(performance.now() - started), error: String(error?.message || error || status), coverage: resultCoverage, cases })
    const find = selector => { const node = document.querySelector(String(selector || '')); if (!node) throw new Error(`target not found: ${selector}`); return node }
    const evaluate = source => (0, eval)(`(async()=>(${source}))()`), runScript = source => (0, eval)(`(async()=>{${source}\n})()`)
    const resolveValue = async value => {
      if (value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 1 && value.expr !== undefined) return evaluate(String(value.expr))
      if (typeof value === 'string' && /^(testData|subject|globalThis)\b/.test(value)) return evaluate(value)
      return value
    }
    const normalize = value => {
      if (Array.isArray(value)) return value.map(normalize)
      if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, normalize(value[key])]))
      return value
    }
    const equal = (actual, expected) => Object.is(actual, expected) || JSON.stringify(normalize(actual)) === JSON.stringify(normalize(expected))
    const runCheck = async check => {
      if (typeof check === 'string') { if (!await evaluate(check)) throw new Error(`check returned false: ${check}`); return }
      if (check.wait !== undefined) { await new Promise(resolve => setTimeout(resolve, Math.max(0, Number(check.wait) || 0))); return }
      if (check.script !== undefined) { const value = await runScript(String(check.script)); if (value === false) throw new Error('script check returned false'); return }
      if (check.data || check.property) {
        const options = check.data || check.property, actual = await evaluate(String(options.path)), expected = await resolveValue(options.equals)
        if (!equal(actual, expected)) throw new Error(`${check.data ? 'data' : 'property'} ${options.path}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`)
        return
      }
      if (check.dom) {
        const options = check.dom, nodes = [...document.querySelectorAll(String(options.selector || ''))]
        if (options.count !== undefined && nodes.length !== Number(options.count)) throw new Error(`DOM ${options.selector}: expected count ${options.count}, received ${nodes.length}`)
        if (options.exists !== undefined && (!!nodes.length) !== !!options.exists) throw new Error(`DOM ${options.selector}: expected exists ${!!options.exists}`)
        const texts = nodes.map(node => node.textContent.trim())
        if (options.text !== undefined && texts[0] !== String(await resolveValue(options.text))) throw new Error(`DOM ${options.selector}: expected text ${options.text}, received ${texts[0]}`)
        if (options.texts !== undefined && !equal(texts, await resolveValue(options.texts))) throw new Error(`DOM ${options.selector}: expected texts ${JSON.stringify(options.texts)}, received ${JSON.stringify(texts)}`)
        if (options.containsText !== undefined && !nodes.some(node => node.textContent.includes(String(options.containsText)))) throw new Error(`DOM ${options.selector}: missing text ${options.containsText}`)
        if (options.value !== undefined && !equal(nodes[0]?.value, await resolveValue(options.value))) throw new Error(`DOM ${options.selector}: unexpected value ${nodes[0]?.value}`)
        if (options.checked !== undefined && nodes[0]?.checked !== !!options.checked) throw new Error(`DOM ${options.selector}: unexpected checked state`)
        if (options.class !== undefined && !nodes[0]?.classList.contains(String(options.class))) throw new Error(`DOM ${options.selector}: missing class ${options.class}`)
        return
      }
      if (check.event) {
        const options = check.event, events = globalThis.__componentTestEvents?.[options.name] || []
        if (options.count !== undefined && events.length !== Number(options.count)) throw new Error(`event ${options.name}: expected count ${options.count}, received ${events.length}`)
        if (options.last !== undefined && !equal(events.at(-1), await resolveValue(options.last))) throw new Error(`event ${options.name}: unexpected last detail ${JSON.stringify(events.at(-1))}`)
        return
      }
      throw new Error('unknown test check')
    }
    const runStep = async step => {
      if (typeof step === 'string') return runScript(step)
      if (step.assert !== undefined) { if (!await evaluate(String(step.assert))) throw new Error(`assertion returned false: ${step.assert}`); return }
      if (step.script !== undefined) return runScript(String(step.script))
      if (step.wait !== undefined) return new Promise(resolve => setTimeout(resolve, Math.max(0, Number(step.wait) || 0)))
      if (step.click !== undefined) { find(typeof step.click === 'string' ? step.click : step.click.selector).click(); return }
      if (step.fill !== undefined) { const options = typeof step.fill === 'string' ? { selector: step.fill, value: '' } : step.fill, node = find(options.selector), value = await resolveValue(options.value); node.value = value == null ? '' : String(value); node.dispatchEvent(new Event(options.event || 'input', { bubbles: true })); return }
      if (step.check !== undefined) { const options = typeof step.check === 'string' ? { selector: step.check, checked: true } : step.check, node = find(options.selector); node.checked = options.checked !== false; node.dispatchEvent(new Event(options.event || 'change', { bubbles: true })); return }
      if (step.select !== undefined) { const options = step.select, node = find(options.selector), value = await resolveValue(options.value); node.value = String(value ?? ''); node.dispatchEvent(new Event(options.event || 'change', { bubbles: true })); return }
      if (step.call !== undefined) { const options = step.call, node = options.target ? find(options.target) : globalThis.subject, method = node?.[options.method]; if (typeof method !== 'function') throw new Error(`method not found: ${options.method}`); const value = await method.apply(node, Array.isArray(options.args) ? options.args : []); if (options.saveAs) globalThis[options.saveAs] = value; return }
      if (step.dispatch !== undefined) { const options = step.dispatch; find(options.target).dispatchEvent(new CustomEvent(options.event, { bubbles: options.bubbles === true, cancelable: options.cancelable === true, detail: options.detail })); return }
      if (step.prevent !== undefined) { const eventName = typeof step.prevent === 'string' ? step.prevent : step.prevent.event; globalThis.subject.addEventListener(eventName, event => event.preventDefault(), { once: typeof step.prevent === 'object' ? step.prevent.once !== false : true }); return }
      throw new Error('unknown test step')
    }
    addEventListener('error', event => { if (event instanceof ErrorEvent) fail('error', event.error || event.message) }); addEventListener('unhandledrejection', event => fail('error', event.reason))
    globalThis.__componentTestTimeout = setTimeout(() => fail('error', `Test timed out after ${definition.timeout}ms`), definition.timeout)
    addEventListener('load', () => setTimeout(async () => {
      if (completed) return
      document.body.dataset.testStatus = 'running'
      const cases = []
      try {
        if (!definition.legacy) {
          globalThis.testData = NewState(structuredClone(definition.testData || {})); globalThis.clone = value => Util.clone(value)
          for (const source of definition.init || []) await runScript(source)
          const fixture = document.getElementById('componentTestFixture')
          for (const testCase of definition.cases || []) {
            const caseStarted = performance.now(), steps = [], inspections = []
            const inspect = async phase => {
              if (typeof globalThis.__componentTestInspect !== 'function') return
              try { await globalThis.__componentTestInspect(globalThis.subject, { name:definition.name, caseName:testCase.name, phase }); inspections.push({phase,ok:true}) }
              catch (error) { inspections.push({phase,ok:false,error:String(error?.stack || error)}); throw error }
            }
            try {
              // Component cases are independent. Route and persisted UI state
              // from one case must not select a different conversation/Agent
              // while the next fixture is mounting.
              for (const key of ['chatID', 'chatAgentID', 'chatTemporary', 'chatHistory', 'agentPanel', 'accountID', 'nav']) try { Hash[key] = '' } catch (_) {}
              try { for (const key of Object.keys(LocalStorage || {})) delete LocalStorage[key] } catch (_) {}
              fixture.replaceChildren()
              const subject = document.createElement(definition.name); globalThis.subject = subject
              globalThis.__componentTestEvents = Object.fromEntries((definition.events || []).map(eventName => [eventName, []]))
              for (const eventName of definition.events || []) subject.addEventListener(eventName, event => { if (event.target === subject) globalThis.__componentTestEvents[eventName].push(event.detail) })
              for (const [attribute, rawValue] of Object.entries(testCase.attributes || {})) {
                if (rawValue === false || rawValue == null) continue
                subject.setAttribute(attribute, rawValue === true ? '' : String(rawValue))
              }
              if (!subject.id) subject.id = 'subject'
              for (const [slotName, html] of Object.entries(testCase.slots || {})) {
                const holder = document.createElement('template'); holder.innerHTML = String(html || '').trim()
                const roots = [...holder.content.children]
                if (roots.length !== 1) throw new Error(`slot ${slotName} must contain exactly one root element`)
                roots[0].setAttribute('slot', slotName); subject.appendChild(holder.content)
              }
              fixture.appendChild(subject); await new Promise(resolve => setTimeout(resolve, definition.settle || 0)); await inspect('mounted')
              const phases = [['before', testCase.before || [], runCheck], ['actions', testCase.actions || [], runStep], ['after', testCase.after || [], runCheck]]
              let stepIndex = 0
              for (const [phase, items, execute] of phases) for (const item of items) {
                const stepStarted = performance.now()
                try { await execute(item); if (phase === 'actions') await inspect('action-'+stepIndex); steps.push({ index: stepIndex++, phase, ok: true, duration: Math.round(performance.now() - stepStarted) }) }
                catch (error) { steps.push({ index: stepIndex++, phase, ok: false, duration: Math.round(performance.now() - stepStarted), error: String(error?.stack || error?.message || error) }); throw error }
              }
              await inspect('complete')
            } catch (_) {}
            finally {
              // A case must not leak live subscriptions, refresh timers, or DOM
              // observers into the next case in a full-suite run.
              for (const mounted of fixture.querySelectorAll(definition.name)) {
                try { if (mounted._bufferSubscription) mounted._bufferSubscription.waiter = null; mounted._bufferSubscription?.controller?.abort() } catch (_) {}
                try { mounted.runController?.abort() } catch (_) {}
                try { clearTimeout(mounted._chatRefreshTimer); clearTimeout(mounted._liveRefreshTimer); clearTimeout(mounted._hostRefreshTimer) } catch (_) {}
                try { mounted._messageObserver?.disconnect() } catch (_) {}
                try { mounted.id = `retired-${Math.random().toString(36).slice(2)}` } catch (_) {}
              }
              await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
            }
            cases.push({ name: testCase.name, ok: steps.length === (testCase.before.length + testCase.actions.length + testCase.after.length) && steps.every(step => step.ok) && inspections.every(item => item.ok), duration: Math.round(performance.now() - caseStarted), steps, inspections })
          }
          const failed = cases.filter(item => !item.ok).length + coverage.missing.length + coverage.unknown.length
          publish({ protocol: definition.protocol, name: definition.name, status: failed ? 'failed' : 'passed', passed: cases.filter(item => item.ok).length, failed, duration: Math.round(performance.now() - started), coverage: resultCoverage, cases }); return
        }
        for (const testCase of definition.cases || []) {
          const caseStarted = performance.now(), steps = []
          for (const [index, step] of (testCase.steps || []).entries()) {
            const stepStarted = performance.now()
            try { await runStep(step); steps.push({ index, ok: true, duration: Math.round(performance.now() - stepStarted) }) }
            catch (error) { steps.push({ index, ok: false, duration: Math.round(performance.now() - stepStarted), error: String(error?.stack || error?.message || error) }); break }
          }
          cases.push({ name: testCase.name, covers: testCase.covers, ok: steps.length === (testCase.steps || []).length && steps.every(step => step.ok), duration: Math.round(performance.now() - caseStarted), steps })
        }
        const failed = cases.filter(item => !item.ok).length + coverage.missing.length + coverage.unknown.length
        publish({ protocol: 'apigo.component-test-result/v2', name: definition.name, status: failed ? 'failed' : 'passed', passed: cases.filter(item => item.ok).length, failed, duration: Math.round(performance.now() - started), coverage: resultCoverage, cases })
      } catch (error) { fail('error', error, cases) }
    }, definition.settle || 0))
  })();
