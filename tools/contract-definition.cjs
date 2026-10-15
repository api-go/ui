// Coverage and case normalization shared with master ui-check.
module.exports=(name,contract,test,selectedCase='',geometry=false)=>{
const protocol='apigo.component-test/v3',legacyProtocol='apigo.component-test/v2',legacy=test.protocol===legacyProtocol;
const fail=(status,message)=>{throw new Error(message)};
  const required = new Set(), addKeys = (prefix, value) => { if (value && typeof value === 'object' && !Array.isArray(value)) for (const key of Object.keys(value)) if (!key.startsWith('_')) required.add(`${prefix}.${key}`) }
  for (const [attribute, detail] of Object.entries(contract.attributes || {})) {
    let values = Array.isArray(detail) ? detail : detail && typeof detail === 'object' && Array.isArray(detail.values) ? detail.values : typeof detail === 'string' && detail.includes('|') ? detail.split(';')[0].split('|').map(value => value.trim()) : []
    values = values.map(value => String(value || '').trim()).filter(value => /^[A-Za-z0-9_-]+$/.test(value))
    if (values.length) for (const value of values) required.add(`attributes.${attribute}.${value}`); else required.add(`attributes.${attribute}`)
  }
  addKeys('properties', contract.properties); addKeys('methods', contract.methods); addKeys('events', contract.events); addKeys('slots', contract.slots); addKeys('state', contract.state)
  for (const item of test.coverage?.required || []) required.add(String(item || '').trim())
  const declared = new Set(test.cases.flatMap(item => Array.isArray(item?.covers) ? item.covers : []).map(value => String(value || '').trim()).filter(Boolean))
  if (!legacy) for (const item of test.cases) {
    for (const [key, value] of Object.entries(item?.attributes || {})) {
      const stateMatch = key.match(/^\$\.state\.([A-Za-z_$][\w$]*)$/)
      if (stateMatch && Object.hasOwn(contract.state || {}, stateMatch[1])) declared.add(`state.${stateMatch[1]}`)
      if (Object.hasOwn(contract.attributes || {}, key)) {
        const detail = contract.attributes[key], values = (Array.isArray(detail) ? detail : detail && typeof detail === 'object' && Array.isArray(detail.values) ? detail.values : typeof detail === 'string' && detail.includes('|') ? detail.split(';')[0].split('|').map(value => value.trim()) : []).map(String)
        declared.add(values.includes(String(value)) ? `attributes.${key}.${value}` : `attributes.${key}`)
      }
    }
    for (const slot of Object.keys(item?.slots || {})) declared.add(`slots.${slot}`)
    for (const check of [...(item?.before || []), ...(item?.after || [])]) {
      if (check?.event?.name) declared.add(`events.${check.event.name}`)
      const path = check?.property?.path || ''
      const stateMatch = String(path).match(/^subject\.state\.([A-Za-z_$][\w$]*)/), propertyMatch = String(path).match(/^subject\.([A-Za-z_$][\w$]*)/)
      if (stateMatch && Object.hasOwn(contract.state || {}, stateMatch[1])) declared.add(`state.${stateMatch[1]}`)
      if (propertyMatch && Object.hasOwn(contract.properties || {}, propertyMatch[1])) declared.add(`properties.${propertyMatch[1]}`)
    }
    for (const action of item?.actions || []) if (action?.call?.method) declared.add(`methods.${action.call.method}`)
  }
  const missing = [...required].filter(item => !declared.has(item)).sort(), unknown = [...declared].filter(item => !required.has(item)).sort()
  const mappedCases = test.cases.slice(0, 200).map((item, index) => ({ name: String(item?.name || `case ${index + 1}`).slice(0, 200), attributes: item?.attributes || {}, slots: item?.slots || {}, before: Array.isArray(item?.before) ? item.before : [], actions: Array.isArray(item?.actions) ? item.actions : [], after: Array.isArray(item?.after) ? item.after : [] }))
  const selectedIndex = selectedCase === '' ? -1 : Number(selectedCase)
  if (selectedCase !== '' && (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= mappedCases.length)) return fail(400, 'Invalid test case')
	// A complete component run is intentionally serial so shared fixtures remain
	// deterministic. Give the aggregate a larger bounded budget while keeping an
	// independently selected case capped at 30 seconds.
	const timeoutLimit = selectedIndex < 0 ? 120000 : 30000
	const testTimeout = geometry ? 120000 : Math.min(timeoutLimit, Math.max(250, Number(test.timeout || 5000)))
  const definition = legacy
    ? { protocol: legacyProtocol, legacy: true, name, timeout: testTimeout, settle: Math.min(5000, Math.max(0, Number(test.settle || 50))), coverage: { required: [...required].sort(), declared: [...declared].sort(), missing, unknown }, cases: test.cases.slice(0, 200).map((item, index) => ({ name: String(item?.name || `case ${index + 1}`).slice(0, 200), covers: (Array.isArray(item?.covers) ? item.covers : []).map(String), steps: (Array.isArray(item?.steps) ? item.steps : []).slice(0, 200) })) }
    : { protocol, name, timeout: testTimeout, settle: Math.min(5000, Math.max(0, Number(test.settle || 50))), coverage: { required: [...required].sort(), declared: [...declared].sort(), missing, unknown }, events: Object.keys(contract.events || {}), testData: test.testData || {}, init: Array.isArray(test.init) ? test.init.map(String) : test.init ? [String(test.init)] : [], cases: selectedIndex < 0 ? mappedCases : [mappedCases[selectedIndex]] }


return definition;
};
