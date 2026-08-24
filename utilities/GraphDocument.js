/**
 * JSON graph normalization, mutation, and tree layout helpers.
 */
const GraphDocument = (() => {
  const id = prefix => `${prefix}-${globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)}`
  const clone = value => globalThis.Editor?.clone ? globalThis.Editor.clone(value) : JSON.parse(JSON.stringify(value))
  const nestedToGraph = root => {
    const nodes = [], edges = []
    const visit = (raw, parentId) => {
      const nodeId = String(raw.id || id('node'))
      const { children, ...node } = raw
      nodes.push({ ...node, id: nodeId, title: node.title ?? node.text ?? node.content ?? '{#Node#}' })
      if (parentId) edges.push({ id: id('edge'), from: parentId, to: nodeId })
      ;(children || []).forEach(child => visit(child, nodeId))
    }
    visit(root)
    return { nodes, edges, view: {} }
  }
  const normalize = input => {
    if (!input || typeof input !== 'object') input = {}
    if (!Array.isArray(input.nodes)) {
      const root = input.root || (input.id || input.children ? input : null)
      if (root) return nestedToGraph(root)
    }
    const data = clone(input)
    data.nodes = Array.isArray(data.nodes) ? data.nodes : []
    data.edges = Array.isArray(data.edges) ? data.edges : []
    data.view = data.view && typeof data.view === 'object' ? data.view : {}
    const seen = new Set()
    data.nodes = data.nodes.map(raw => {
      let nodeId = String(raw.id || id('node'))
      while (seen.has(nodeId)) nodeId = id('node')
      seen.add(nodeId)
      return { ...raw, id: nodeId, title: raw.title ?? raw.text ?? raw.content ?? '{#Node#}' }
    })
    const nodeIds = new Set(data.nodes.map(node => node.id))
    const edgeIds = new Set()
    data.edges = data.edges.map(raw => {
      let edgeId = String(raw.id || id('edge'))
      while (edgeIds.has(edgeId)) edgeId = id('edge')
      edgeIds.add(edgeId)
      return { ...raw, id: edgeId, from: String(raw.from ?? raw.source ?? ''), to: String(raw.to ?? raw.target ?? '') }
    }).filter(edge => nodeIds.has(edge.from) && nodeIds.has(edge.to) && edge.from !== edge.to)
    for (const node of data.nodes) {
      if (node.parentId && nodeIds.has(String(node.parentId)) && !data.edges.some(edge => edge.to === node.id)) {
        data.edges.push({ id: id('edge'), from: String(node.parentId), to: node.id })
      }
    }
    return data
  }
  const children = (data, parentId) => data.edges.filter(edge => edge.from === parentId).map(edge => data.nodes.find(node => node.id === edge.to)).filter(Boolean)
  const descendants = (data, nodeId, found = new Set()) => {
    for (const child of children(data, nodeId)) if (!found.has(child.id)) { found.add(child.id); descendants(data, child.id, found) }
    return found
  }
  const addNode = (data, node = {}, parentId = null) => {
    const created = { title: '{#New node#}', ...node, id: String(node.id || id('node')) }
    data.nodes.push(created)
    if (parentId) addEdge(data, parentId, created.id)
    return created
  }
  const addEdge = (data, from, to, edge = {}) => {
    if (from === to || data.edges.some(item => item.from === from && item.to === to)) return null
    if (!data.nodes.some(node => node.id === from) || !data.nodes.some(node => node.id === to)) return null
    const created = { ...edge, id: String(edge.id || id('edge')), from, to }
    data.edges.push(created)
    return created
  }
  const removeNode = (data, nodeId, { cascade = false } = {}) => {
    const removed = new Set([nodeId])
    if (cascade) descendants(data, nodeId, removed)
    data.nodes = data.nodes.filter(node => !removed.has(node.id))
    data.edges = data.edges.filter(edge => !removed.has(edge.from) && !removed.has(edge.to))
    return [...removed]
  }
  const removeEdge = (data, edgeId) => { data.edges = data.edges.filter(edge => edge.id !== edgeId) }
  const layoutTree = (input, { direction = 'right', nodeWidth = 160, nodeHeight = 56, hGap = 72, vGap = 24, sizes = {} } = {}) => {
    const data = normalize(input)
    const incoming = new Set(data.edges.map(edge => edge.to))
    const roots = data.nodes.filter(node => !incoming.has(node.id))
    if (!roots.length && data.nodes.length) roots.push(data.nodes[0])
    const byId = new Map(data.nodes.map(node => [node.id, node]))
    const childIds = new Map()
    data.edges.forEach(edge => { if (!childIds.has(edge.from)) childIds.set(edge.from, []); childIds.get(edge.from).push(edge.to) })
    const measure = nodeId => ({ width: Number(sizes[nodeId]?.width) || nodeWidth, height: Number(sizes[nodeId]?.height) || nodeHeight })
    const heights = new Map(), visiting = new Set()
    const totalHeight = nodeId => {
      if (heights.has(nodeId)) return heights.get(nodeId)
      if (visiting.has(nodeId)) return nodeHeight
      visiting.add(nodeId)
      const node = byId.get(nodeId), own = measure(nodeId).height
      const ids = node?.collapsed ? [] : (childIds.get(nodeId) || []).filter(childId => byId.has(childId))
      const value = ids.length ? Math.max(own, ids.reduce((sum, childId) => sum + totalHeight(childId), 0) + vGap * (ids.length - 1)) : own
      visiting.delete(nodeId); heights.set(nodeId, value); return value
    }
    const positioned = [], visible = new Set(), layoutVisiting = new Set()
    const place = (nodeId, depth, x, top) => {
      if (layoutVisiting.has(nodeId) || visible.has(nodeId)) return
      layoutVisiting.add(nodeId)
      const node = byId.get(nodeId), size = measure(nodeId), branchHeight = totalHeight(nodeId)
      const y = top + (branchHeight - size.height) / 2
      positioned.push({ ...node, x, y, width: size.width, height: size.height, depth })
      visible.add(nodeId)
      if (!node.collapsed) {
        let childTop = top
        for (const childId of childIds.get(nodeId) || []) {
          if (!byId.has(childId)) continue
          const childSize = measure(childId)
          const childX = direction === 'left' ? x - hGap - childSize.width : x + size.width + hGap
          place(childId, depth + 1, childX, childTop)
          childTop += totalHeight(childId) + vGap
        }
      }
      layoutVisiting.delete(nodeId)
    }
    let top = 0
    roots.forEach(root => { place(root.id, 0, 0, top); top += totalHeight(root.id) + vGap * 2 })
    const positions = new Map(positioned.map(node => [node.id, node]))
    const edges = data.edges.filter(edge => visible.has(edge.from) && visible.has(edge.to)).map(edge => {
      const from = positions.get(edge.from), to = positions.get(edge.to)
      const x1 = direction === 'left' ? from.x : from.x + from.width
      const x2 = direction === 'left' ? to.x + to.width : to.x
      const y1 = from.y + from.height / 2, y2 = to.y + to.height / 2
      const mid = (x1 + x2) / 2
      return { ...edge, path: `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}` }
    })
    return { data, nodes: positioned, edges }
  }
  return { id, normalize, children, descendants, addNode, addEdge, removeNode, removeEdge, layoutTree }
})()

globalThis.GraphDocument = GraphDocument
