/**
 * DataGrid Component Module
 * Consolidated with perf, scroll, and selection managers.
 */

// Global Configuration
const MODE_MAP = {
	text: ['contains', 'equals', 'starts', 'ends'],
	textarea: ['contains', 'equals', 'starts', 'ends'],
	number: ['=', '>', '<', 'between'],
	date: ['=', '>', '<', 'between'],
	select: ['contains', 'equals'],
	TagsInput: ['contains', 'equals', 'starts', 'ends']
};

const MODE_ICONS = {
	'contains': 'bi-search', 'equals': 'bi-distribute-vertical', 'starts': 'bi-align-start', 'ends': 'bi-align-end',
	'=': 'bi-calculator', '>': 'bi-chevron-right', '<': 'bi-chevron-left', 'between': 'bi-arrows-expand'
};

const MODE_LABELS = {
	contains: '{#Contains#}', equals: '{#Equals#}', starts: '{#Starts with#}', ends: '{#Ends with#}',
	between: '{#Between#}'
};

const DataGridConfig = {
	_fieldTypes: new Map(),
	registerFieldType: (config) => {
		DataGridConfig._fieldTypes.set(config.value, config);
	},
	getFieldTypes: () => Array.from(DataGridConfig._fieldTypes.values())
};

const DataGridPageCache = {
	limit: 10000,
	session: '',
	tables: new Map(),
	getSession() {
		if (!this.session) this.session = globalThis.crypto?.randomUUID?.() || `dg_${Date.now()}_${Math.random().toString(36).slice(2)}`;
		return this.session;
	},
	reset() {
		this.session = '';
		this.tables.clear();
	},
	table(name) {
		if (!this.tables.has(name)) this.tables.set(name, new Map());
		return this.tables.get(name);
	}
};

const DB_EDITOR_TYPE_MAP = {
	i: 'number', ui: 'number', bi: 'number', ubi: 'number', ti: 'number', f: 'number', ff: 'number',
	b: 'switch', d: 'date', dt: 'datetime', t: 'textarea', o: 'code'
};
const getDataKey = field => field?.name;
// settings.type is the authoritative application/editor type. field.type is a
// database storage type and is only a fallback for legacy field definitions.
const getEditorType = field => {
	// Date storage types must remain date editors even when legacy metadata has
	// a stale generic settings.type value.
	if (field?.type === 'd' || field?.type === 'date') return 'date';
	if (field?.type === 'dt' || field?.type === 'datetime') return 'datetime';
	const configured = String(field?.settings?.type || '').toLowerCase();
	if (configured === 'datepicker' || configured === 'date') return 'date';
	if (configured === 'datetime' || configured === 'datetime-local') return 'datetime';
	return field?.settings?.type || DB_EDITOR_TYPE_MAP[field?.type] || 'text';
};
const SYSTEM_FIELDS = [
	{ id: '__system_id', name: 'id', type: 'v100', system: true, settings: { label: 'ID', width: 130 } },
	{ id: '__system_creator', name: 'creator', type: 'v100', system: true, settings: { label: '{#Creator#}', width: 120 } },
	{ id: '__system_createTime', name: 'createTime', type: 'bi', system: true, settings: { label: '{#Create Time#}', width: 150 } },
	{ id: '__system_updater', name: 'updater', type: 'v100', system: true, settings: { label: '{#Updater#}', width: 120 } },
	{ id: '__system_updateTime', name: 'updateTime', type: 'bi', system: true, settings: { label: '{#Update Time#}', width: 150 } }
];

// Register Built-in Types
DataGridConfig.registerFieldType({
	value: 'text', label: '{#Text#}', typeForDB: 'v100',
	schema: [{ name: 'placeholder', label: '{#Placeholder#}', type: 'text', if: 'this.data.user_type=="text"' }]
});
DataGridConfig.registerFieldType({
	value: 'number', label: '{#Number#}', typeForDB: 'ff',
	schema: [
		{ name: 'decimals', label: '{#Decimals#}', type: 'number', setting: { min: 0, max: 10 }, if: 'this.data.user_type=="number"' },
		{ name: 'prefix', label: '{#Prefix (e.g. $)#}', type: 'text', if: 'this.data.user_type=="number"' },
		{ name: 'suffix', label: '{#Suffix (e.g. %)#}', type: 'text', if: 'this.data.user_type=="number"' },
		{ name: 'thousandSep', label: '{#Thousand Sep#}', type: 'switch', if: 'this.data.user_type=="number"' }
	],
	formatter: (val, field) => {
		if (val == null || val === '') return '';
		let num = Number(val);
		if (isNaN(num)) return val;
		const s = field.settings || {};
		if (s.decimals !== undefined) num = num.toFixed(s.decimals);
		let str = String(num);
		if (s.thousandSep) {
			const parts = str.split('.');
			parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
			str = parts.join('.');
		}
		return (s.prefix || '') + str + (s.suffix || '');
	}
});
DataGridConfig.registerFieldType({
	value: 'select', label: '{#Single Select#}', typeForDB: 'v100',
	schema: [{ name: 'options_str', label: '{#Options#}', type: 'textarea', setting: { rows: 3, placeholder: '{#Label:Value per line#}' }, if: 'this.data.user_type=="select"' }],
	formatter: (val, field) => {
		if (val == null || val === '') return '';
		const opts = field.settings?.options || [];
		const opt = opts.find(o => typeof o === 'object' ? o.value == val : o == val);
		return opt ? (typeof opt === 'object' ? opt.label : opt) : val;
	}
});
DataGridConfig.registerFieldType({
	value: 'checkbox', label: '{#Multi Select#}', typeForDB: 'v4096',
	schema: [{ name: 'options_str', label: '{#Options#}', type: 'textarea', setting: { rows: 3, placeholder: '{#Label:Value per line#}' }, if: 'this.data.user_type=="checkbox"' }],
	formatter: (val, field) => {
		if (!Array.isArray(val)) return val == null ? '' : String(val);
		const opts = field.settings?.options || [];
		return val.map(v => {
			const opt = opts.find(o => typeof o === 'object' ? o.value == v : o == v);
			return opt ? (typeof opt === 'object' ? opt.label : opt) : v;
		}).join(', ');
	}
});
DataGridConfig.registerFieldType({
	value: 'switch', label: '{#Switch#}', typeForDB: 'b',
	schema: [
		{ name: 'labelOn', label: '{#Label On#}', type: 'text', if: 'this.data.user_type=="switch"' },
		{ name: 'labelOff', label: '{#Label Off#}', type: 'text', if: 'this.data.user_type=="switch"' }
	],
	formatter: (val, field) => {
		const s = field.settings || {};
		return val ? (s.labelOn || '{#Yes#}') : (s.labelOff || '{#No#}');
	}
});
DataGridConfig.registerFieldType({
	value: 'datetime', label: '{#DateTime#}', typeForDB: 'dt',
	schema: [{ name: 'format', label: '{#Format#}', type: 'text', setting: { placeholder: 'YYYY-MM-DD' }, if: 'this.data.user_type=="datetime"' }]
});
DataGridConfig.registerFieldType({
	value: 'textarea', label: '{#Long Text#}', typeForDB: 't',
	schema: [{ name: 'placeholder', label: '{#Placeholder#}', type: 'text', if: 'this.data.user_type=="textarea"' }]
});
DataGridConfig.registerFieldType({
	value: 'code', label: '{#Code#}', typeForDB: 'o', schema: [],
	formatter: (val) => {
		if (val == null || val === '') return '';
		if (typeof val !== 'object') return String(val);
		try { return JSON.stringify(val, null, 2); } catch (_) { return String(val); }
	}
});

const getDefaultDbType = (editorType, decimals = 0) => {
	const typeInfo = DataGridConfig._fieldTypes.get(editorType);
	return editorType === 'number' ? (Number(decimals) > 0 ? 'ff' : 'bi') : (typeInfo?.typeForDB || 'v100');
};
const normalizeDBType = (value, fallback = 'v100') => {
	const type = String(value || '').trim().toLowerCase();
	if (/^(?:i|ui|bi|ubi|ti|uti|f|uf|ff|uff|si|usi|mi|umi|t|o|dt|d|tm|b|bb|ver)$/.test(type)) return type;
	const sized = type.match(/^(v|c)([1-9]\d*)$/);
	return sized ? sized[1] + sized[2] : fallback;
};

const DB_TYPE_OPTIONS = [
	['i', '{#Integer#}'], ['ui', '{#Unsigned Integer#}'], ['bi', '{#Big Integer#}'], ['ubi', '{#Unsigned Big Integer#}'], ['ti', '{#Tiny Integer#}'],
	['v', '{#Text (VARCHAR)#}'], ['c', '{#Fixed Text (CHAR)#}'], ['t', '{#Long Text#}'], ['o', '{#Object (JSON)#}'], ['dt', '{#Date & Time#}'], ['d', '{#Date#}'], ['tm', '{#Time#}'],
	['f', '{#Float#}'], ['ff', '{#Double#}'], ['b', '{#Boolean#}'], ['bb', '{#Binary (BLOB)#}']
];

globalThis.Component.register('DBTypeInput', container => {
	let value = normalizeDBType(container.value || 'v100');
	container.state.options = DB_TYPE_OPTIONS.map(([value, label]) => ({ value, label }));
	const parse = value => {
		const raw = String(value || 'v100').trim().toLowerCase();
		const match = raw.match(/^(v|c)([1-9]\d*)$/);
		container.state.family = match ? match[1] : (/^[vc]/.test(raw) ? raw[0] : normalizeDBType(raw));
		container.state.length = match?.[2] || (/^[vc]/.test(raw) ? '100' : '');
	};
	const compose = () => {
		const family = container.state.family || 'v';
		const length = Math.max(1, Math.trunc(Number(container.state.length) || 100));
		container.value = normalizeDBType((family === 'v' || family === 'c') ? family + length : family);
		container.dispatchEvent(new Event('change', { bubbles: true }));
	};
	Object.defineProperty(container, 'value', { configurable: true, get: () => value, set: next => { value = normalizeDBType(next || 'v100'); parse(value); } });
	container.addEventListener('bind', event => { if (event.target === container) container.value = event.detail; });
	container.addEventListener('change', event => { if (event.target.matches('select')) setTimeout(compose); });
	container.addEventListener('input', event => { if (event.target.matches('input')) setTimeout(compose); });
	parse(container.value);
}, globalThis.Util.makeDom(/*html*/`
	<div class="input-group">
		<select class="form-select" $bind="this.state.family"><option $each="this.state.options || []" as="opt" $value="opt.value" $text="opt.label"></option></select>
		<input $if="this.state.family === 'v' || this.state.family === 'c'" class="form-control text-end" style="max-width:110px" type="number" min="1" step="1" placeholder="{#Length#}" $bind="this.state.length">
	</div>
`));
globalThis.AutoForm?.register('DBTypeInput', 'dbtype');

// Managers Factory Functions (Internalized)
const createPerfMonitor = () => {
	let enabled = !!globalThis.__DT_PERF_MODE__;
	const stats = { refreshTime: 0, refreshCount: 0, scrollCount: 0, totalNodes: 0 };
	if (enabled && !globalThis.__statePerformanceTelemetry) {
		globalThis.__statePerformanceTelemetry = { scanCount: 0, reuseCount: 0, moveCount: 0 };
	}
	return {
		get stats() { return stats; },
		enable: () => { enabled = true; },
		disable: () => { enabled = false; },
		onScroll: () => { if (enabled) stats.scrollCount++; },
		startFrame: () => {
			if (!enabled) return null;
			return {
				start: performance.now(),
				scan: globalThis.__statePerformanceTelemetry?.scanCount || 0,
				move: globalThis.__statePerformanceTelemetry?.moveCount || 0,
				reuse: globalThis.__statePerformanceTelemetry?.reuseCount || 0
			};
		},
		endFrame: (startData, renderedCount) => {
			if (!enabled || !startData) return;
			stats.refreshCount++; stats.totalNodes += renderedCount;
			const elapsed = performance.now() - startData.start;
			stats.refreshTime += elapsed;
			const stPerf = globalThis.__statePerformanceTelemetry;
			if (stPerf) {
				const scans = stPerf.scanCount - startData.scan;
				const moves = stPerf.moveCount - startData.move;
				const reuses = stPerf.reuseCount - startData.reuse;
				if (scans > 0 || elapsed > 2) {
					console.log(`[DataGrid Frame] Time: ${elapsed.toFixed(2)}ms, Scans: ${scans}, Moves: ${moves}, Reuses: ${reuses}, Rows: ${renderedCount}`);
				}
			}
		}
	};
};

const createScrollManager = (container, state, onRenderedListChange) => {
	let rowHeight = parseFloat(getComputedStyle(container).getPropertyValue('--ui-grid-row')) || 40;
	let vs = globalThis.VirtualScroll({ itemHeight: rowHeight });
	let scrollEl = null;
	const refresh = (isLayoutChange = false) => {
		if (!scrollEl) return;
		const res = vs.calc(scrollEl, state.list);
		if (res) {
			if (!isLayoutChange && state.prevHeight === res.prevHeight && state.postHeight === res.postHeight && state._listStartIndex === res.listStartIndex && state._renderedList.length === res.renderedList.length) return;
			Object.assign(state, { prevHeight: res.prevHeight, postHeight: res.postHeight, _listStartIndex: res.listStartIndex, _renderedList: res.renderedList });
			onRenderedListChange?.(res.renderedList.length, isLayoutChange);
		}
	};
	let stopDensity;
	const manager = {
		init: () => {
			scrollEl = container.querySelector('.dt-main');
			if (!stopDensity && globalThis.Bootstrap?.observeDensity) {
				stopDensity = Bootstrap.observeDensity(container, (_, css) => {
					const next = parseFloat(css.getPropertyValue('--ui-grid-row')) || 40;
					if (next === rowHeight) return;
					const top = scrollEl.scrollTop / rowHeight * next;
					rowHeight = next; vs = globalThis.VirtualScroll({ itemHeight: rowHeight });
					manager.reset(state.list); scrollEl.scrollTop = top; refresh(true);
				});
				DOMDisposer.add(container, stopDensity);
			}
		},
		reset: (list) => {
			state._listStartIndex = 0;
			const validList = Array.isArray(list) ? list : [];
			const initialList = vs.reset(validList, scrollEl || container);
			Object.assign(state, { prevHeight: 0, postHeight: 0, _renderedList: initialList });
			// Async bindings evaluate to undefined before their API response arrives.
			// State arrays may be exposed through a proxy, so reference equality with
			// the watcher value is not a reliable test that the list is current.
			if (Array.isArray(list)) vs.init(validList, () => refresh(true));
		},
		refresh, onScroll: () => refresh(false)
	};
	return manager;
};

const createSelectionManager = (container, state) => {
	let activeBounds = null; let startCell = null; let multiSelections = [];
	const isCellSelected = (r, c) => {
		if (activeBounds && r >= activeBounds.minRow && r <= activeBounds.maxRow && c >= activeBounds.minCol && c <= activeBounds.maxCol) return true;
		return multiSelections.some(s => r >= s.minRow && r <= s.maxRow && c >= s.minCol && c <= s.maxCol);
	};
	let lastHadSelection = false;
	const applySelectionUI = () => {
		if (globalThis.__DT_FEATURES__ && !globalThis.__DT_FEATURES__.selection) return;
		let boundMinRow = Infinity, boundMaxRow = -Infinity;
		if (activeBounds) { boundMinRow = Math.min(boundMinRow, activeBounds.minRow); boundMaxRow = Math.max(boundMaxRow, activeBounds.maxRow); }
		multiSelections.forEach(s => { boundMinRow = Math.min(boundMinRow, s.minRow); boundMaxRow = Math.max(boundMaxRow, s.maxRow); });
		const hasSelection = boundMinRow !== Infinity;
		if (!hasSelection && !lastHadSelection) return;
		lastHadSelection = hasSelection;
		const body = container.querySelector('.dt-body');
		if (!body) return;
		const rowNodes = body.querySelectorAll('.dt-body-row');
		rowNodes.forEach(rowNode => {
			const absoluteRow = (rowNode._ref?.rIdx ?? -1) + state._listStartIndex;
			const cells = rowNode.querySelectorAll('.dt-cell');
			if (!hasSelection || absoluteRow < boundMinRow || absoluteRow > boundMaxRow) { cells.forEach(cell => cell.classList.remove('dt-cell-selected')); return; }
			cells.forEach((cell, cIdx) => { if (isCellSelected(absoluteRow, cIdx)) cell.classList.add('dt-cell-selected'); else cell.classList.remove('dt-cell-selected'); });
		});
	};
	const updateStatus = () => {
		let count = 0; if (activeBounds) count += (activeBounds.maxRow - activeBounds.minRow + 1);
		multiSelections.forEach(s => count += (s.maxRow - s.minRow + 1));
		state.selectedRowCount = count;
	};
	const clearAllActive = (keepSelection = false) => { if (!keepSelection) { activeBounds = null; startCell = null; multiSelections = []; applySelectionUI(); updateStatus(); } };
	const startSelect = (row, col, e) => {
		const alreadySelected = isCellSelected(row, col);
		const isRange = (activeBounds && (activeBounds.minRow !== activeBounds.maxRow || activeBounds.minCol !== activeBounds.maxCol)) || multiSelections.length > 0;
		if (e.shiftKey && startCell) { activeBounds = { minRow: Math.min(startCell.row, row), maxRow: Math.max(startCell.row, row), minCol: Math.min(startCell.col, col), maxCol: Math.max(startCell.col, col) }; }
		else {
			if (alreadySelected && !e.ctrlKey && !e.metaKey) { if (!isRange) container._potentialCancel = { row, col }; }
			else { if (!e.ctrlKey && !e.metaKey) clearAllActive(); else if (activeBounds && !alreadySelected) multiSelections.push(activeBounds); startCell = { row, col }; activeBounds = { minRow: row, maxRow: row, minCol: col, maxCol: col }; }
			state.isSelecting = true;
		}
		applySelectionUI(); updateStatus(); container.focus();
	};
	const updateSelect = (row, col) => { if (state.isSelecting && startCell) { activeBounds = { minRow: Math.min(startCell.row, row), maxRow: Math.max(startCell.row, row), minCol: Math.min(startCell.col, col), maxCol: Math.max(startCell.col, col) }; container._potentialCancel = null; applySelectionUI(); updateStatus(); } };
	const endSelect = () => { if (container._potentialCancel) { const { row, col } = container._potentialCancel; if (isCellSelected(row, col)) clearAllActive(); container._potentialCancel = null; } state.isSelecting = false; };
	const getSelectionBounds = () => {
		if (!activeBounds) return null;
		let minRow = activeBounds.minRow, maxRow = activeBounds.maxRow, minCol = activeBounds.minCol, maxCol = activeBounds.maxCol;
		multiSelections.forEach(s => { minRow = Math.min(minRow, s.minRow); maxRow = Math.max(maxRow, s.maxRow); minCol = Math.min(minCol, s.minCol); maxCol = Math.max(maxCol, s.maxCol); });
		return { minRow, maxRow, minCol, maxCol };
	};
	const getSelectedRows = () => {
		const indexes = new Set();
		const add = bounds => { if (bounds) for (let row = bounds.minRow; row <= bounds.maxRow; row++) indexes.add(row); };
		add(activeBounds); multiSelections.forEach(add);
		return [...indexes].sort((a, b) => a - b).map(index => state.list[index]).filter(Boolean);
	};
	const selectAllRows = () => {
		if (!state.list.length || !state._displayFields.length) return clearAllActive();
		startCell = { row: 0, col: 0 };
		multiSelections = [];
		activeBounds = { minRow: 0, maxRow: state.list.length - 1, minCol: 0, maxCol: state._displayFields.length - 1 };
		applySelectionUI(); updateStatus(); container.focus();
	};
	const copy = async () => {
		const bounds = getSelectionBounds(); if (!bounds) return;
		const text = state.list.slice(bounds.minRow, bounds.maxRow + 1).map(row => {
			return state._displayFields.slice(bounds.minCol, bounds.maxCol + 1).map(f => {
				let val = String(row[getDataKey(f)] ?? '');
				if (val.includes('\t') || val.includes('\n') || val.includes('"')) val = '"' + val.replace(/"/g, '""') + '"';
				return val;
			}).join('\t');
		}).join('\n');
		await navigator.clipboard.writeText(text);
	};
	const paste = async () => {
		try {
			const text = await navigator.clipboard.readText(); if (!text) return;
			const bounds = getSelectionBounds(); if (!bounds) return;
			const rows = text.split(/\r?\n/).filter(line => line.length > 0).map(line => {
				const cells = []; let current = '', inQuotes = false;
				for (let i = 0; i < line.length; i++) {
					const char = line[i];
					if (char === '"') { if (inQuotes && line[i + 1] === '"') { current += '"'; i++; } else inQuotes = !inQuotes; }
					else if (char === '\t' && !inQuotes) { cells.push(current); current = ''; }
					else current += char;
				}
				cells.push(current); return cells;
			});
			let { minRow: startRow, minCol: startCol, maxRow, maxCol } = bounds;
			if (minRow === maxRow && minCol === maxCol) {
				maxRow = Infinity;
				maxCol = Infinity;
			}
			const body = container.querySelector('.dt-body');
			const rowNodes = body ? Array.from(body.childNodes).filter(n => n.classList?.contains('dt-body-row')) : [];
			let anyRowChanged = false;
			rows.forEach((rowData, rOffset) => {
				const rIdx = startRow + rOffset; if (rIdx > maxRow || rIdx >= state.list.length) return;
				const rowItem = state.list[rIdx]; let rowChanged = false;
				rowData.forEach((cellData, cOffset) => { const cIdx = startCol + cOffset; if (cIdx > maxCol || cIdx >= state._displayFields.length) return; const field = state._displayFields[cIdx]; if (field.system) return; rowItem[getDataKey(field)] = cellData; rowChanged = true; });
				if (rowChanged) anyRowChanged = true;
			});
			if (anyRowChanged) state.list = [...state.list];
		} catch (err) { console.error('Paste Error:', err); }
	};
	return { applySelectionUI, clearAllActive, selectAllRows, startSelect, updateSelect, endSelect, getSelectionBounds, getSelectedRows, copy, paste };
};

// Component Registration
globalThis.Component.register('DataGrid', container => {
	if (!container.state) container.state = globalThis.NewState({})
	const state = container.state
	container.editable = container.hasAttribute('editable')
	container.readonly = container.hasAttribute('readonly')
	container.cacheEnabled = container.hasAttribute('cache')
	container.getDataKey = getDataKey
	container.getEditorType = getEditorType
	container.apiUrl = container.getAttribute('api') || ''

	Object.assign(state, {
		list: [], fields: [], _displayFields: [], _renderedList: [],
		prevHeight: 0, postHeight: 0, _listStartIndex: 0,
		selectedRowCount: 0,
		_originalList: [],
		sortConfig: { fieldId: null, direction: null },
		filterConfig: {},
		activeFieldId: null, activeField: null, activeModes: [],
		_columnStats: {}, _internalUpdate: false, _appliedHash: '', _fieldsDirty: false, _masterCellNodes: null,
		_skipNextListSnapshot: false,
		isDirty: false, changedCells: [], isBulkEdit: null, advancedMode: false, fieldAdvanced: false, rowFormIndex: -1, table: state.table || '', apiLoading: false, total: 0,
		cellDetailTitle: '', cellDetailValue: '',
		revealTarget: null, revealReason: '', _revealedValues: {},
		editable: container.editable, readonly: container.readonly, showAdvanced: !container.hasAttribute('no-advanced'), rowFormMin: 0, rowFormMax: -1
	})

	const getDisplayFields = () => {
		const fields = state.fields.map(field => field.name === 'priority' && field.type === 'ff'
			? { ...field, rowOrder: true, settings: { ...(field.settings || {}), label: '', width: 42 } }
			: field);
		if (state.advancedMode) fields.push(...SYSTEM_FIELDS);
		const pinRank = field => (field.settings?.pinned || field.pinned) === 'left' ? 0 : (field.settings?.pinned || field.pinned) === 'right' ? 2 : 1;
		fields.sort((a, b) => pinRank(a) - pinRank(b));
		return fields;
	};
	const alignNumericColumns = () => setTimeout(() => {
		const numeric = new Set(state._displayFields.map((field, index) => ((['i', 'ui', 'bi', 'ubi', 'ti', 'f', 'ff'].includes(field.type) || field.settings?.type === 'number') ? index : -1)).filter(index => index >= 0));
		container.querySelectorAll('.dt-row, .dt-header-row').forEach(row => row.querySelectorAll('.dt-cell').forEach((cell, index) => {
			const isNumeric = numeric.has(index);
			cell.classList.toggle('text-end', isNumeric);
			const content = [...cell.children].find(child => child.tagName !== 'TEMPLATE' && getComputedStyle(child).display !== 'none');
			content?.classList.toggle('text-end', isNumeric);
			content?.classList.toggle('w-100', isNumeric);
		}));
	}, 0);
	const requestApi = async (action, payload = {}) => {
		if (!container.apiUrl || !state.table) return null;
		state.apiLoading = true;
		try {
			const response = await globalThis.HTTP.request({ url: container.apiUrl, method: 'POST', data: { action, name: state.table, ...payload } });
			const result = response.result;
			if (!response.ok || !result?.ok) throw new Error(result?.error || response.error || `${action} failed`);
			return result;
		} catch (error) {
			globalThis.Toast?.show(error.message, { type: 'danger' });
			throw error;
		} finally {
			state.apiLoading = false;
		}
	};
	const protectedCellKey = (item, field) => `${String(item?.id || '')}\x00${String(field?.id || field?.name || '')}`;
	container.protectedCellKey = protectedCellKey;
	container.canRevealProtectedValue = (item, field) => {
		const value = item?.[getDataKey(field)];
		return !!container.apiUrl && !!state.table && String(value ?? '').includes('****') && !Object.hasOwn(state._revealedValues, protectedCellKey(item, field)) && ['Sensitive', 'Secret'].includes(normalizeProtection(field?.protection, !!field?.isSecret));
	};
	container.protectedCellValue = (item, field) => state._revealedValues[protectedCellKey(item, field)] ?? container.format(item?.[getDataKey(field)], field);
	container.copyProtectedValue = async (item, field, event) => {
		event?.preventDefault?.(); event?.stopPropagation?.();
		const value = state._revealedValues[protectedCellKey(item, field)];
		if (value === undefined) return false;
		let copied = false;
		try { await globalThis.navigator?.clipboard?.writeText(String(value)); copied = true; } catch (_) { /* Browser denied clipboard access. */ }
		globalThis.Toast?.show(copied ? '{#Protected value copied#}' : '{#Protected value revealed; clipboard access was denied#}', { type: copied ? 'success' : 'warning' });
		return copied;
	};
	container.toggleProtectedValue = (item, field, event) => {
		event?.preventDefault?.(); event?.stopPropagation?.();
		const key = protectedCellKey(item, field);
		if (Object.hasOwn(state._revealedValues, key)) {
			const values = { ...state._revealedValues }; delete values[key]; state._revealedValues = values; return;
		}
		if (!container.canRevealProtectedValue(item, field)) return;
		state.revealTarget = { id: item.id, field: field.name, key };
		state.revealReason = '';
		container.querySelector('.datagrid-reveal-modal')?.show();
	};
	container.submitProtectedReveal = async () => {
		const target = state.revealTarget, reason = String(state.revealReason || '').trim();
		if (!target || !reason) { globalThis.Toast?.show('{#Reason is required#}', { type: 'warning' }); return false; }
		let result; try { result = await requestApi('reveal', { id: target.id, field: target.field, reason }); } catch (_) { return false; }
		const secret = String(result.secret ?? '');
		state._revealedValues = { ...state._revealedValues, [target.key]: secret };
		state.revealReason = ''; state.revealTarget = null;
		container.querySelector('.datagrid-reveal-modal')?.hide(true);
		await container.copyProtectedValue({ id: target.id }, { id: target.key.split('\x00')[1] });
		return true;
	};
	const buildQuery = () => {
		const filter = [];
		Object.entries(state.filterConfig).forEach(([fieldId, config]) => {
			const fieldDef = getDisplayFields().find(item => item.id === fieldId);
			if (!fieldDef || (!config.value && !config.selectedValues?.length)) return;
			if (config.selectedValues?.length) { filter.push({ field: fieldDef.name, operator: 'in', value: config.selectedValues }); return; }
			const operator = { equals: 'eq', '=': 'eq', '>': 'gt', '<': 'lt', contains: 'contains', starts: 'startsWith', ends: 'endsWith', between: 'between' }[config.mode] || 'contains';
			filter.push({ field: fieldDef.name, operator, value: operator === 'between' ? [config.value, config.value2] : config.value });
		});
		const sortField = state.sortConfig.fieldId && getDisplayFields().find(item => item.id === state.sortConfig.fieldId);
		return { filter, sort: sortField ? [`${sortField.name} ${state.sortConfig.direction === 'desc' ? 'DESC' : 'ASC'}`] : [] };
	};
	container.getQuery = () => buildQuery();
	const mergeCachedRows = rows => {
		if (!container.cacheEnabled) return rows;
		const cache = DataGridPageCache.table(state.table);
		return rows.map(row => {
			const id = String(row?.id || '');
			if (!id) throw new Error('DataGrid cache row is missing an id');
			const isReference = Object.keys(row).length === 1;
			if (isReference) {
				const cached = cache.get(id);
				if (!cached) throw new Error(`DataGrid cache miss: ${id}`);
				return globalThis.Util.clone(cached);
			}
			if (cache.has(id) || cache.size < DataGridPageCache.limit) cache.set(id, globalThis.Util.clone(row));
			return row;
		});
	};
	const queryApi = async () => {
		const payload = { ...buildQuery(), offset: 0, limit: 1000 };
		if (container.cacheEnabled) payload.dataSession = DataGridPageCache.getSession();
		let response = await requestApi('query', payload);
		let rows = Array.isArray(response.data) ? response.data : (Array.isArray(response.list) ? response.list : []);
		try { return { response, list: mergeCachedRows(rows) }; }
		catch (error) {
			if (!container.cacheEnabled) throw error;
			DataGridPageCache.reset();
			payload.dataSession = DataGridPageCache.getSession();
			response = await requestApi('query', payload);
			rows = Array.isArray(response.data) ? response.data : (Array.isArray(response.list) ? response.list : []);
			return { response, list: mergeCachedRows(rows) };
		}
	};
	container.load = async ({ fields = false } = {}) => {
		if (!container.apiUrl || !state.table) return;
		try {
			if (fields) {
				const response = await requestApi('fields');
				state.fields = Array.isArray(response.fields) ? response.fields : [];
				state.fullAccess = !!response.fullAccess;
				// Table metadata exists before its first field creates the physical
				// table. Keep that valid empty state editable without querying it.
				if (state.fields.length === 0) {
					state._internalUpdate = true; state.list = []; state._originalList = []; state.total = 0; state._internalUpdate = false; state.isDirty = false; state.changedCells = [];
					return;
				}
			}
			const { response, list } = await queryApi();
			state._internalUpdate = true; state.list = list; state._originalList = globalThis.Util.clone(list); state.total = Number(response.count ?? list.length); state._internalUpdate = false; state.isDirty = false; state.changedCells = [];
		} catch (_) { /* requestApi already reports the error */ }
	};

	const perf = createPerfMonitor();
	state.perf = perf.stats;
	const selection = createSelectionManager(container, state);
	container.getSelectedRows = () => selection.getSelectedRows();
	container.selectAllRows = () => selection.selectAllRows();
	container.clearSelection = () => selection.clearAllActive();
	container.hasRowChanges = () => JSON.stringify(state.list || []) !== JSON.stringify(state._originalList || []);
	container.validateRows = (rows = state.list) => {
		const errors = [];
		for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
			for (const field of state.fields) {
				if (field.system) continue;
				const settings = field.settings || {}, attrs = settings.attrs || {};
				const value = rows[rowIndex]?.[getDataKey(field)];
				const empty = value === undefined || value === null || value === '';
				if ((settings.required || attrs.required) && empty) errors.push({ row: rowIndex, field: field.name, message: `{#Row {row}: {field} is required||${rowIndex + 1}||${field.name}#}` });
				const pattern = settings.pattern || attrs.pattern;
				if (!empty && pattern) {
					try { if (!new RegExp(pattern).test(String(value))) errors.push({ row: rowIndex, field: field.name, message: `{#Row {row}: {field} has an invalid format||${rowIndex + 1}||${field.name}#}` }); }
					catch (_) { errors.push({ row: rowIndex, field: field.name, message: `{#{field} has an invalid validation pattern||${field.name}#}` }); }
				}
			}
		}
		return { ok: errors.length === 0, errors, invalidRows: [...new Set(errors.map(error => error.row))] };
	};
	const scroll = createScrollManager(container, state, () => setTimeout(() => { selection.applySelectionUI(); container.applyChangedCellsUI(); }, 50));

	const menuNode = container.querySelector('.dt-column-menu');
	if (menuNode) menuNode._thisObj = container;

	container.onColumnResizing = (field, e) => container.style.setProperty(`--w-${field.id}`, e.detail.newSize + 'px');
	container.onColumnResize = async (field, e) => {
		const idx = state.fields.findIndex(f => f.id === field.id);
		if (idx !== -1) {
			const updated = { ...state.fields[idx], settings: { ...(state.fields[idx].settings || {}), width: e.detail.newSize } };
			if (container.apiUrl) {
				try { await requestApi('setField', { fields: [updated] }); } catch (_) { return; }
			}
			state.fields[idx] = updated; state.fields = [...state.fields];
			container.dispatchEvent(new CustomEvent('resizefield', { detail: updated }));
		}
	};
	container.clearDragPreview = () => {
		const preview = state.dragPreview;
		if (preview?.parentNode) preview.parentNode.removeChild(preview);
		state.dragPreview = null;
	};
	container.createDragPreview = (source, event) => {
		container.clearDragPreview();
		if (!source?.cloneNode) {
			source = document.createElement('div');
			source.textContent = state.dragFieldId ? (state.fields.find(field => field.id === state.dragFieldId)?.settings?.label || state.fields.find(field => field.id === state.dragFieldId)?.name || '') : '';
		}
		const preview = source.cloneNode(true);
		preview.className = 'dt-drag-preview bg-body text-body border border-primary rounded shadow';
		preview.style.cssText = 'position:fixed;left:-10000px;top:-10000px;z-index:10000;width:max-content;max-width:420px;pointer-events:none;font-size:.8125rem;line-height:1.25;opacity:.96;';
		preview.querySelectorAll('input,button,Resizer,[draggable]').forEach(node => node.remove());
		document.body.append(preview); state.dragPreview = preview;
		if (event.dataTransfer?.setDragImage) event.dataTransfer.setDragImage(preview, 14, 14);
	};
	container.onFieldDragStart = (field, event) => {
		if (event.target?.closest?.('Resizer') || !container.editable || state.readonly || field.system) return event.preventDefault();
		state.dragFieldId = field.id;
		event.dataTransfer.effectAllowed = 'move';
		container.createDragPreview(event.target?.closest?.('span') || event.target, event);
	};
	container.clearDragIndicators = () => container.querySelectorAll('.dt-drop-before, .dt-drop-row').forEach(node => node.classList.remove('dt-drop-before', 'dt-drop-row'));
	container.onFieldDragOver = (field, event) => {
		if (!state.dragFieldId || field.system || field.id === state.dragFieldId) return;
		event.preventDefault(); container.clearDragIndicators(); event.currentTarget.classList.add('dt-drop-before');
	};
	container.onRowDragOver = (row, event) => {
		if (!state.dragRow || row === state.dragRow || !container.canReorderRows()) return;
		event.preventDefault(); event.stopPropagation(); container.clearDragIndicators(); event.currentTarget.classList.add('dt-drop-row');
	};
	container.onDragEnd = () => { state.dragFieldId = null; state.dragRow = null; container.clearDragIndicators(); container.clearDragPreview(); };
	container.addEventListener('dragover', event => {
		if (!state.dragFieldId) return;
		const header = event.target?.closest?.('.dt-header-row .dt-cell');
		if (!header || header.dataset.id === state.dragFieldId) return;
		container.clearDragIndicators(); header.classList.add('dt-drop-before');
	});
	container.addEventListener('dragleave', event => {
		const header = event.target?.closest?.('.dt-header-row .dt-cell');
		if (header && !header.contains(event.relatedTarget)) header.classList.remove('dt-drop-before');
	});
	container.addEventListener('dragend', container.onDragEnd);
	container.canReorderRows = () => !state.readonly && container.editable && !state.sortConfig.fieldId && !Object.values(state.filterConfig || {}).some(filter => filter?.value || filter?.selectedValues?.length);
	container.onRowDragStart = (row, event) => {
		if (!container.canReorderRows()) return event.preventDefault();
		state.dragRow = row; event.dataTransfer.effectAllowed = 'move'; event.stopPropagation();
		const rowNode = event.target?.closest?.('.dt-body-row');
		if (rowNode) container.createDragPreview(rowNode, event);
	};
	container.onRowDrop = async (target, event) => {
		event.preventDefault(); event.stopPropagation();
		container.clearDragIndicators();
		const source = state.dragRow;
		if (!source || source === target || !container.canReorderRows()) return;
		const original = [...state.list], ordered = [...state.list];
		const from = ordered.indexOf(source), targetIndex = ordered.indexOf(target);
		if (from < 0 || targetIndex < 0) return;
		ordered.splice(from, 1);
		const to = Math.min(targetIndex, ordered.length);
		ordered.splice(to, 0, source);
		const before = ordered[to - 1], after = ordered[to + 1];
		const beforeValue = Number(before?.priority), afterValue = Number(after?.priority);
		const gap = afterValue - beforeValue;
		const tolerance = Number.EPSILON * Math.max(1, Math.abs(beforeValue), Math.abs(afterValue)) * 8;
		let changed = [];
		if (!before) { source.priority = Number.isFinite(afterValue) ? afterValue - 100 : 100; changed = [source]; }
		else if (!after) { source.priority = Number.isFinite(beforeValue) ? beforeValue + 100 : 100; changed = [source]; }
		else if (Number.isFinite(gap) && gap > tolerance) { source.priority = beforeValue + gap / 2; changed = [source]; }
		else {
			// Re-space only a bounded neighborhood. This avoids an unbounded
			// UPDATE when a very large table has exhausted floating-point gaps.
			const start = Math.max(0, to - 10), end = Math.min(ordered.length - 1, to + 10);
			const lower = start > 0 ? Number(ordered[start - 1].priority) : 0;
			const upper = end + 1 < ordered.length ? Number(ordered[end + 1].priority) : NaN;
			const count = end - start + 1;
			const step = Number.isFinite(upper) && upper > lower ? (upper - lower) / (count + 1) : 100;
			if (!Number.isFinite(step) || step <= Number.EPSILON * Math.max(1, Math.abs(lower), Math.abs(upper)) * 8) {
				state.dragRow = null;
				globalThis.Toast?.show('{#The nearby priority range is exhausted; reorder a wider section before trying again.#}', { type: 'warning' });
				return;
			}
			changed = ordered.slice(start, end + 1);
			changed.forEach((row, index) => { row.priority = lower + step * (index + 1); });
		}
		if (container.apiUrl) {
			try { await requestApi('save', { data: changed }); }
			catch (_) { state.list = original; state.dragRow = null; container.clearDragPreview(); return; }
			for (const changedRow of changed) {
				const snapshot = state._originalList.find(row => row.id === changedRow.id);
				if (snapshot) snapshot.priority = changedRow.priority;
			}
		} else state.isDirty = true;
		state.list = ordered; state.dragRow = null; container.clearDragPreview();
		container.dispatchEvent(new CustomEvent('reorderrows', { detail: { list: ordered, changed } }));
	};
	container.onFieldDrop = async (target, event) => {
		event.preventDefault();
		container.clearDragIndicators();
		if (!state.dragFieldId || target.system || target.id === state.dragFieldId) return;
		const fields = [...state.fields];
		const from = fields.findIndex(field => field.id === state.dragFieldId), to = fields.findIndex(field => field.id === target.id);
		if (from < 0 || to < 0) return;
		const [moved] = fields.splice(from, 1); fields.splice(to, 0, moved);
		fields.forEach((field, index) => { field.priority = index + 1; });
		if (container.apiUrl) {
			try { await requestApi('setField', { fields }); } catch (_) { return; }
		}
		state.fields = fields; state.dragFieldId = null;
		container.dispatchEvent(new CustomEvent('reorderfields', { detail: fields }));
	};

	let _editorOverlay, currentEditingNode = null, currentEditingRow = null;

	container.format = (val, field) => {
		if (field.formatter) return field.formatter(val, field);
		const typeInfo = DataGridConfig._fieldTypes.get(getEditorType(field));
		if (typeInfo && typeInfo.formatter) return typeInfo.formatter(val, field);
		return val == null ? '' : (typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val));
	};

	container.onScroll = () => {
		perf.onScroll(); scroll.refresh();
		const main = container.querySelector('.dt-main'), header = container.querySelector('.dt-header');
		if (main && header) header.scrollLeft = main.scrollLeft;
		container.hideColumnMenu();
		container.hideEditor(true);
		const prev = container.querySelector('.dt-spacer-prev'), post = container.querySelector('.dt-spacer-post');
		if (prev) { prev.style.height = (state.prevHeight || 0) + 'px'; prev.style.display = state.prevHeight > 0 ? 'block' : 'none'; }
		if (post) { post.style.height = (state.postHeight || 0) + 'px'; post.style.display = state.postHeight > 0 ? 'block' : 'none'; }
	};
	container.ensureFooterHost = footer => {
		if (footer?.parentElement !== container) container.appendChild(footer);
	};

	container.applySortFilter = (options = {}) => {
		if (state._internalUpdate) return;
		const targetFilters = { ...state.filterConfig, ...(options.filters || {}) };
		const targetSort = options.sort !== undefined ? (options.sort ? { fieldId: state.activeFieldId, direction: options.sort } : { fieldId: null, direction: null }) : state.sortConfig;

		if (container.apiUrl) {
			const previousSort = state.sortConfig;
			const previousFilters = state.filterConfig;
			state.filterConfig = targetFilters; state.sortConfig = targetSort;
			const reload = async () => {
				if (container.hasRowChanges() && !await globalThis.Dialog.confirm('{#Discard unsaved changes and reload data?#}')) { state.filterConfig = previousFilters; state.sortConfig = previousSort; return; }
				await container.load();
			};
			reload();
			return;
		}
		let filtered = [...state._originalList];
		Object.entries(targetFilters).forEach(([fId, cfg]) => {
			if (!cfg.value && (!cfg.selectedValues || cfg.selectedValues.length === 0)) return;
			filtered = filtered.filter(item => {
				const field = state._displayFields.find(item => item.id === fId);
				const val = item[getDataKey(field)];
				if (cfg.selectedValues?.length > 0) return cfg.selectedValues.includes(String(val));
				const search = String(cfg.value).toLowerCase();
				const target = String(val ?? '').toLowerCase();
				switch (cfg.mode) {
					case 'contains': return target.includes(search);
					case 'equals': return target === search;
					case 'starts': return target.startsWith(search);
					case 'ends': return target.endsWith(search);
					case '=': return Number(val) === Number(cfg.value);
					case '>': return Number(val) > Number(cfg.value);
					case '<': return Number(val) < Number(cfg.value);
					case 'between': return Number(val) >= Number(cfg.value) && Number(val) <= Number(cfg.value2);
					default: return true;
				}
			});
		});

		if (targetSort.fieldId && targetSort.direction) {
			const fId = targetSort.fieldId;
			const dir = targetSort.direction === 'asc' ? 1 : -1;
			filtered.sort((a, b) => {
				const field = state._displayFields.find(item => item.id === fId);
				const dataKey = getDataKey(field);
				if (a[dataKey] == b[dataKey]) return 0;
				return a[dataKey] > b[dataKey] ? dir : -dir;
			});
		}

		state._internalUpdate = true;
		Object.assign(state.filterConfig, targetFilters);
		Object.assign(state.sortConfig, targetSort);
		state._skipNextListSnapshot = true;
		state.list = filtered;
		state._internalUpdate = false;
	};
	container.deferSortFilter = () => {
		clearTimeout(container._sortFilterTimer);
		container._sortFilterTimer = setTimeout(() => container.applySortFilter(), 150);
	};

	container.showColumnMenu = (field, event) => {
		const btn = event.currentTarget, menu = container.querySelector('.dt-column-menu');
		if (menu.style.display === 'block' && state.activeFieldId === field.id) {
			container.hideColumnMenu();
			return;
		}
		container.hideColumnMenu();
		const type = getEditorType(field);
		state.activeModes = MODE_MAP[type] || (['boolean', 'switch', 'checkbox', 'radio'].includes(type) ? [] : MODE_MAP.text);
		if (!state.filterConfig[field.id]) state.filterConfig[field.id] = { mode: state.activeModes[0] || 'contains', value: '', selectedValues: [] };
		state.activeField = field; state.activeFieldId = field.id;
		menu.style.display = 'block';
		const cellNode = btn.closest('.dt-cell'), rect = cellNode.getBoundingClientRect(), rootRect = container.getBoundingClientRect();
		const menuWidth = menu.offsetWidth || 260;
		let leftPos = rect.right - rootRect.left - menuWidth;
		if (leftPos < 0) leftPos = Math.max(0, rect.left - rootRect.left);
		menu.style.left = leftPos + 'px'; menu.style.top = (rect.bottom - rootRect.top + 5) + 'px';

		const onGlobalClick = (ev) => { if (menu.contains(ev.target) || btn.contains(ev.target)) return; container.hideColumnMenu(); };
		container._columnMenuOutsideHandler = onGlobalClick;
		document.addEventListener('mousedown', onGlobalClick);
		setTimeout(() => menu.querySelector('input')?.focus(), 50);
	};

	container.toggleSelectedValue = (val) => {
		const filter = state.filterConfig[state.activeFieldId]; if (!filter) return;
		const selectedValues = [...(filter.selectedValues || [])];
		const idx = selectedValues.indexOf(val); if (idx === -1) selectedValues.push(val); else selectedValues.splice(idx, 1);
		state.filterConfig[state.activeFieldId] = { ...filter, selectedValues }; container.deferSortFilter();
	};

	container.filterOnlyThis = (val) => { state.filterConfig[state.activeFieldId] = { mode: 'contains', value: '', selectedValues: [String(val)] }; container.deferSortFilter(); };
	container.hideColumnMenu = () => {
		const menu = container.querySelector('.dt-column-menu');
		if (menu) menu.style.display = 'none';
		if (container._columnMenuOutsideHandler) {
			document.removeEventListener('mousedown', container._columnMenuOutsideHandler);
			container._columnMenuOutsideHandler = null;
		}
	};
	container.setSort = (dir) => { const newDir = state.sortConfig.direction === dir && state.sortConfig.fieldId === state.activeFieldId ? null : dir; clearTimeout(container._sortFilterTimer); container._sortFilterTimer = setTimeout(() => container.applySortFilter({ sort: newDir }), 0); };
	container.clearColumnSettings = () => { if (!state.activeFieldId) return; state.filterConfig[state.activeFieldId] = { mode: state.activeModes[0] || 'contains', value: '', value2: '', selectedValues: [] }; container.deferSortFilter(); };

	container._initRow = (rowNode) => {
		const row = rowNode._ref?.item;
		if (row) Object.defineProperty(row, '_dtRowNode', { value: rowNode, writable: true, configurable: true, enumerable: false });
		if (row && row._editingF === undefined) { Object.defineProperty(row, '_editingF', { set: (v) => { if (v === null) container.hideEditor(true); }, configurable: true }); }
		Array.from(rowNode.children).forEach(cell => { const fIdx = parseInt(cell.dataset.fidx); if (!isNaN(fIdx)) cell._ref = { ...(cell._ref || rowNode._ref), f: state._displayFields[fIdx], fIdx: fIdx }; });
	};
	container.markChanged = (row, cellNode = currentEditingNode) => {
		if (!row || !cellNode) return;
		const fIdx = parseInt(cellNode.dataset.fidx);
		if (isNaN(fIdx) || state.changedCells.some(item => item.row === row && item.fIdx === fIdx)) return;
		state.changedCells = [...state.changedCells, { row, fIdx }];
		container.applyChangedCellsUI();
	};
	container.applyChangedCellsUI = () => {
		const changed = state.changedCells;
		container.querySelectorAll('.dt-body-row').forEach(rowNode => {
			const row = rowNode._ref?.item;
			rowNode.querySelectorAll('.dt-cell').forEach((cell, fIdx) => cell.classList.toggle('dt-cell-changed', !!row && changed.some(item => item.row === row && item.fIdx === fIdx)));
		});
	};
	container.getChangedRowCount = () => new Set(state.changedCells.map(item => item.row)).size;

	state.__watch('fields', fields => {
		if (!Array.isArray(fields)) return;
		fields = getDisplayFields(); state._displayFields = fields;
		state._fieldsDirty = true; state._masterCellNodes = null;
		container.style.setProperty('--dt-grid-template', fields.map((f, index) => {
			const width = (f.settings?.width || f.width) || (f.fillColumn ? 160 : 150);
			return `var(--w-${f.id}, ${width}px)`;
		}).join(' '));
		container.style.setProperty('--dt-row-width', `max(${fields.reduce((sum, f) => sum + ((f.settings?.width || f.width) || 150), 0)}px, 100%)`);

		let leftSum = 0;
		fields.forEach(f => {
			const pinned = f.settings?.pinned || f.pinned;
			if (pinned === 'left') { container.style.setProperty(`--l-${f.id}`, leftSum + 'px'); leftSum += ((f.settings?.width || f.width) || 150); }
		});
		alignNumericColumns();
		let rightSum = 0;
		[...fields].reverse().forEach(f => {
			const pinned = f.settings?.pinned || f.pinned;
			if (pinned === 'right') { container.style.setProperty(`--r-${f.id}`, rightSum + 'px'); rightSum += ((f.settings?.width || f.width) || 150); }
		});

	});

	state.__watch('list', list => {
		const skipSnapshot = state._skipNextListSnapshot;
		state._skipNextListSnapshot = false;
		if (!skipSnapshot && !state.isDirty) {
			state._originalList = globalThis.Util.clone(list || []);
			setTimeout(() => {
				const stats = {};
				state._displayFields.forEach(f => {
					const counts = {};
					state._originalList.forEach(item => { const val = item[getDataKey(f)], key = (val == null || val === '') ? '' : String(val); counts[key] = (counts[key] || 0) + 1; });
					stats[f.id] = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([val, count]) => ({ val, count }));
				});
				state._columnStats = stats;
			}, 200);
		}
		scroll.init(); scroll.reset(list);
		alignNumericColumns();
	});
	state.__watch('advancedMode', () => { state.fields = [...state.fields]; state.list = [...state.list]; });
	state.__watch('table', table => { if (container.apiUrl && table) container.load({ fields: true }); });
	state.__watch('isDirty', dirty => { if (globalThis.State?.changes) globalThis.State.changes[String(container.changebind || `DataGrid:${container.id || ''}`)] = !!dirty });
	if (container.apiUrl && state.table) setTimeout(() => container.load({ fields: true }));

	container.editCell = (row, field, cellNode) => {
		const main = container.querySelector('.dt-main');
		const overlay = container.querySelector('.dt-editor-overlay'), rect = cellNode.getBoundingClientRect(), mainRect = main.getBoundingClientRect();
		currentEditingNode = cellNode;
		currentEditingRow = row;
		const editorType = getEditorType(field);
		const formType = ['date', 'datetime'].includes(editorType) ? 'DatePicker' : editorType;
		const isCode = formType === 'code';
		const isSimple = ['text', 'number', 'select', 'date', 'datetime', 'DatePicker'].includes(formType);
		const isComplex = ['textarea', 'TagsInput', 'checkbox', 'radio'].includes(formType);
		overlay.classList.toggle('dt-editor-code', isCode);
		overlay.classList.toggle('dt-editor-simple', isSimple);
		const form = overlay.querySelector('AutoForm');
		if (form) {
			// Assign the schema first, then the cloned row data. This keeps a
			// native select from exposing its first option before its model value.
			const setting = { ...(field.settings?.attrs || {}), required: !!(field.settings?.required || field.settings?.attrs?.required) };
			if (isCode) { setting.lang = 'json'; setting.style = 'height:100%;min-height:240px;align-self:stretch;flex:1 1 auto;'; }
			const pattern = field.settings?.pattern || field.settings?.attrs?.pattern;
			if (pattern) setting.pattern = pattern;
			else delete setting.pattern;
			form.state.schema = [{ name: getDataKey(field), label: '', type: formType, options: field.settings?.options || field.options, setting }];
			const editData = globalThis.Util.clone(row);
			if (formType === 'code' && editData[getDataKey(field)] != null && typeof editData[getDataKey(field)] === 'object') {
				editData[getDataKey(field)] = JSON.stringify(editData[getDataKey(field)], null, 2);
			}
			form.state.data = globalThis.NewState(editData);
		}
		const mainPaddingTop = parseFloat(getComputedStyle(main).paddingTop) || 0;
		let topPos = rect.top - mainRect.top + main.scrollTop - mainPaddingTop - 1;
		let leftPos = rect.left - mainRect.left + main.scrollLeft - 1;
		const maxVisibleWidth = Math.max(rect.width + 2, main.clientWidth - 16);
		let editorWidth = Math.min(Math.max(rect.width + 2, isCode ? 760 : (isComplex ? 420 : 0)), maxVisibleWidth);
		const editorHeight = isCode ? Math.min(320, Math.max(240, main.clientHeight - Math.max(0, rect.top - mainRect.top) - 8)) : null;

		const maxLeft = Math.min(main.scrollWidth - editorWidth - 5, main.scrollLeft + main.clientWidth - editorWidth - 5);
		if (leftPos > maxLeft) leftPos = Math.max(0, maxLeft);

		Object.assign(overlay.style, {
			display: 'flex',
			left: leftPos + 'px',
			top: topPos + 'px',
			width: editorWidth + 'px',
			height: isCode ? editorHeight + 'px' : (isSimple ? rect.height + 2 + 'px' : 'auto'),
			minHeight: (isCode ? 240 : rect.height + 2) + 'px',
			maxHeight: Math.max(100, mainRect.height - (rect.top - mainRect.top) - 5) + 'px',
			overflow: 'auto',
			resize: isCode ? 'both' : 'none',
			border: '1px solid var(--bs-border-color)',
			padding: '0'
		});
		setTimeout(() => overlay.querySelector('input, textarea, select, .form-control')?.focus(), 30);
	};

	container.hideEditor = (save = true) => {
		if (!_editorOverlay) _editorOverlay = container.querySelector('.dt-editor-overlay');
		if (!_editorOverlay || _editorOverlay.style.display === 'none') return;
		const form = _editorOverlay.querySelector('AutoForm');
		if (save && form && form.data) {
			const input = _editorOverlay.querySelector('input:focus, select:focus, textarea:focus');
			if (input) input.dispatchEvent(new Event(input.type === 'number' || input.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
			if (form.form && !form.form.reportValidity()) return false;

			let hasChanges = false;
			let invalidEditorValue = false;
			const schema = form.state.schema || [];
			schema.forEach(field => {
				const row = currentEditingRow;
				let nextValue = form.data[field.name];
				if (row && field.type === 'code') {
					try { nextValue = nextValue == null || nextValue === '' ? null : JSON.parse(nextValue); }
					catch (_) { invalidEditorValue = true; }
				}
				if (row && JSON.stringify(row[field.name]) !== JSON.stringify(nextValue)) {
					row[field.name] = nextValue;
					hasChanges = true;
				}
			});
			if (invalidEditorValue) { globalThis.Toast?.show('{#Invalid JSON#}', { type: 'danger' }); return false; }

			if (state.isBulkEdit) {
				const { minRow, maxRow, fIdx } = state.isBulkEdit;
				const field = state._displayFields[fIdx]; const dataKey = getDataKey(field); const newValue = form.data[dataKey];
				for (let i = minRow; i <= maxRow; i++) {
					if (state.list[i] && state.list[i][dataKey] !== newValue) {
						container.markChanged(state.list[i], currentEditingNode);
						state.list[i][dataKey] = newValue;
						hasChanges = true;
					}
				}
			}
			if (hasChanges) {
				container.markChanged(currentEditingRow, currentEditingNode);
				state.isDirty = true;
				state.list = [...state.list];
				setTimeout(() => container.applyChangedCellsUI(), 0);
			}
		}
		_editorOverlay.style.display = 'none';
		if (form) { form.state.schema = []; form.state.data = globalThis.NewState({}); form.data = null; }
		currentEditingNode = null; currentEditingRow = null; state.isBulkEdit = null; container.focus();
		return true;
	};

	container.onMainMouseDown = e => {
		const cell = e.target.closest('.dt-cell'), row = cell?.closest('.dt-row');
		if (!row || row.classList.contains('dt-header-row')) return;
		const fIdx = cell.dataset.fidx ? parseInt(cell.dataset.fidx) : Array.from(row.querySelectorAll('.dt-cell')).indexOf(cell);
		const rIdx = row._ref?.rIdx ?? Array.from(container.querySelectorAll('.dt-body-row')).indexOf(row);
		selection.startSelect(rIdx + state._listStartIndex, fIdx, e);
	};

	container.onMainMouseOver = e => {
		if (state.isSelecting) {
			const cell = e.target.closest('.dt-cell'), row = cell?.closest('.dt-row');
			if (row && !row.classList.contains('dt-header-row')) {
				const fIdx = cell.dataset.fidx ? parseInt(cell.dataset.fidx) : Array.from(row.querySelectorAll('.dt-cell')).indexOf(cell);
				const rIdx = row._ref?.rIdx ?? Array.from(container.querySelectorAll('.dt-body-row')).indexOf(row);
				selection.updateSelect(rIdx + state._listStartIndex, fIdx);
			}
		}
	};

	container.showCellDetail = (value, field = {}) => {
		state.cellDetailTitle = field.settings?.label || field.name || '{#Details#}'
		state.cellDetailValue = typeof value === 'string' ? value : JSON.stringify(value, null, 2)
		container.querySelector('.datagrid-cell-detail-modal')?.show()
	};

	container.onMainDblClick = e => {
		if (!container.editable || state.readonly) return;
		const directRow = e.target.classList?.contains('dt-body-row') ? e.target : null;
		if (directRow) {
			const rIdx = directRow._ref?.rIdx ?? Array.from(container.querySelectorAll('.dt-body-row')).indexOf(directRow);
			state.rowFormMin = 0; state.rowFormMax = state.list.length - 1;
			container.openRowForm(rIdx + state._listStartIndex);
			return;
		}
		const cell = e.target.closest('.dt-cell'), row = cell?.closest('.dt-row');
		if (row && !row.classList.contains('dt-header-row')) {
			const item = row._ref?.item, fIdx = cell.dataset.fidx ? parseInt(cell.dataset.fidx) : Array.from(row.querySelectorAll('.dt-cell')).indexOf(cell);
			const rIdx = row._ref?.rIdx ?? Array.from(container.querySelectorAll('.dt-body-row')).indexOf(row);
			const absoluteRow = rIdx + state._listStartIndex;
			if (e.ctrlKey || e.metaKey) { state.rowFormMin = 0; state.rowFormMax = state.list.length - 1; container.openRowForm(absoluteRow); return; }
			const field = state._displayFields[fIdx];
			if (normalizeProtection(field?.protection, !!field?.isSecret)) return;
			if (field?.type === 'b' || getEditorType(field) === 'switch') return;

			if (item && state._displayFields[fIdx] && !state._displayFields[fIdx].system && !state._displayFields[fIdx].rowOrder) {
				const bounds = selection.getSelectionBounds();
				if (bounds && absoluteRow >= bounds.minRow && absoluteRow <= bounds.maxRow && fIdx >= bounds.minCol && fIdx <= bounds.maxCol) {
					const affectedRows = bounds.maxRow - bounds.minRow + 1;
					if (affectedRows > 1) {
						state.isBulkEdit = { ...bounds, fIdx };
						if (globalThis.UI?.toast) globalThis.UI.toast(`Bulk Edit: Updating ${affectedRows} rows in column "${state._displayFields[fIdx].name}"`, { type: 'warning' });
					}
				}
				container.editCell(item, state._displayFields[fIdx], cell);
			}
		}
	};

	container.rowFormSchema = () => state.fields.map(field => {
		const settings = field.settings || {};
		const setting = { ...(settings.attrs || {}), required: !!(settings.required || settings.attrs?.required) };
		if (settings.pattern || settings.attrs?.pattern) setting.pattern = settings.pattern || settings.attrs.pattern;
		const type = getEditorType(field);
		if (type === 'code') { setting.lang = 'json'; setting.style = 'height:320px;min-height:240px;'; }
		return { name: getDataKey(field), label: field.memo || field.label || field.name, type, options: settings.options || field.options, setting };
	});
	const rowFormData = row => {
		const data = globalThis.Util.clone(row);
		for (const field of state.fields) {
			const key = getDataKey(field), value = data[key];
			if (getEditorType(field) === 'code' && value != null && typeof value === 'object') data[key] = JSON.stringify(value, null, 2);
		}
		return globalThis.NewState(data);
	};
	container.showRowFormAt = index => {
		if (index < 0 || index >= state.list.length) return;
		state.rowFormIndex = index;
		const modal = container.querySelector(`#${CSS.escape(container.id + '_row_modal')}`);
		const form = modal?.querySelector('AutoForm');
		if (form) { form.state.schema = container.rowFormSchema(); form.state.data = rowFormData(state.list[index]); }
	};
	container.openRowForm = index => {
		if (state.readonly) return;
		container.showRowFormAt(index);
		const modal = container.querySelector(`#${CSS.escape(container.id + '_row_modal')}`);
		modal?.show();
		if (!container._rowFormKeyHandler) {
			container._rowFormKeyHandler = event => {
				if (!modal?.classList.contains('show') || !(event.ctrlKey || event.metaKey)) return;
				if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
					event.preventDefault(); const delta = event.key === 'ArrowLeft' ? -1 : 1; const min = state.rowFormMin ?? 0; const max = state.rowFormMax >= min ? state.rowFormMax : state.list.length - 1; container.showRowFormAt(Math.max(min, Math.min(max, state.rowFormIndex + delta)));
				}
			};
			document.addEventListener('keydown', container._rowFormKeyHandler);
		}
	};
	container.editSelectedRows = () => {
		if (state.readonly) return;
		const rows = selection.getSelectedRows();
		if (!rows.length) return;
		const indexes = rows.map(row => state.list.indexOf(row)).filter(index => index >= 0).sort((a, b) => a - b);
		state.rowFormMin = 0; state.rowFormMax = state.list.length - 1;
		container.openRowForm(indexes[0]);
	};
	container.rowFormChanged = () => {
		const modal = container.querySelector(`#${CSS.escape(container.id + '_row_modal')}`);
		const form = modal?.querySelector('AutoForm');
		const row = state.list[state.rowFormIndex];
		if (!form?.data || !row) return;
		for (const field of state.fields) {
			const key = getDataKey(field);
			let value = form.data[key];
			if (getEditorType(field) === 'code') {
				try { value = value == null || value === '' ? null : JSON.parse(value); }
				catch (_) { continue; }
			}
			if (JSON.stringify(row[key]) !== JSON.stringify(value)) row[key] = value;
		}
		state.isDirty = container.hasRowChanges();
		// The form edits the existing row object. Force only the current virtual
		// window to refresh; rebuilding the complete data set defeats virtualization.
		scroll.refresh(true);
	};

	container.toggleSwitchCell = (row, field, event) => {
		event.stopPropagation();
		if (!container.editable || state.readonly || field.system) return;
		row[getDataKey(field)] = !!event.target.checked;
		state.isDirty = true;
		state.list = [...state.list];
	};
	const emptyValueForField = field => {
		const editorType = getEditorType(field);
		if (editorType === 'switch' || field.type === 'b') return false;
		if (editorType === 'number' || ['i', 'ui', 'bi', 'ubi', 'ti', 'f', 'ff'].includes(field.type)) return null;
		return '';
	};
	const normalizeTypedEmptyValues = rows => rows.map(row => {
		let normalized = row;
		for (const field of state.fields) {
			const key = getDataKey(field);
			if (row?.[key] !== '') continue;
			const value = emptyValueForField(field);
			if (value === '') continue;
			if (normalized === row) normalized = { ...row };
			normalized[key] = value;
		}
		return normalized;
	});

	container.addRow = () => {
		if (state.readonly) return;
		const newRow = {}; state.fields.forEach(f => newRow[getDataKey(f)] = emptyValueForField(f));
		const priorityField = state.fields.find(field => field.name === 'priority' && field.type === 'ff');
		if (priorityField) newRow.priority = Math.max(0, ...state.list.map(row => Number(row.priority) || 0)) + 100;
		state.isDirty = true; state.list = [...state.list, newRow];
		setTimeout(() => { scroll.reset(state.list); container.querySelector('.dt-main').scrollTop = container.querySelector('.dt-main').scrollHeight; }, 50);
	};

	container.deleteSelectedRow = async () => {
		if (state.readonly) return;
		const removedItems = selection.getSelectedRows();
		const count = removedItems.length; if (!count) return;
		if (await globalThis.Dialog.confirm(`{#Are you sure you want to delete {count} row(s)?||${count}#}`)) {
			if (container.apiUrl) {
				const removedIDs = removedItems.map(item => item?.id).filter(Boolean);
				try { await requestApi('remove', { data: removedIDs }); }
				catch (_) { return; }
			}
			const removed = new Set(removedItems);
			state.list = state.list.filter(item => !removed.has(item));
			if (container.apiUrl) state._originalList = globalThis.Util.clone(state.list);
			state.isDirty = !container.apiUrl; selection.clearAllActive();
			container.dispatchEvent(new CustomEvent('remove', { detail: { items: removedItems } }));
		}
	};

	container.saveChanges = async () => {
		if (state.readonly) return;
		const savedList = normalizeTypedEmptyValues(state.list);
		if (savedList.some((row, index) => row !== state.list[index])) state.list = savedList;
		const validation = container.validateRows(savedList);
		if (!validation.ok) { globalThis.Toast?.show(validation.errors[0].message, { type: 'danger' }); return false; }
		if (container.apiUrl) {
			try { await requestApi('save', { data: savedList }); }
			catch (_) { return; }
			state._originalList = globalThis.Util.clone(state.list);
		}
		container.dispatchEvent(new CustomEvent('save', { detail: { list: savedList, fields: state.fields } })); container.querySelectorAll('.dt-cell-changed').forEach(node => node.classList.remove('dt-cell-changed')); state.isDirty = false; state.changedCells = []; return true;
	};

	const getFieldSchema = () => {
		const types = globalThis.DataGrid.getFieldTypes();
		const baseSchema = [
			{ name: 'name', label: '{#Field Name#}', type: 'text', setting: { required: true, placeholder: '{#e.g. Display Name#}' } },
			{ name: 'user_type', label: '{#Field Type#}', type: 'select', options: types.map(t => ({ label: t.label, value: t.value })) },
			{ name: 'pinned', label: '{#Pin Column#}', type: 'select', options: [{ label: '{#None#}', value: '' }, { label: '{#Left#}', value: 'left' }, { label: '{#Right#}', value: 'right' }] }
		];
		const dynamicSchema = types.reduce((acc, t) => acc.concat(t.schema || []), []);
		const advancedSchema = state.fieldAdvanced ? [
			{ type: 'divider', label: '{#Advanced Settings#}' },
			{ name: 'semantics', label: '{#Semantics#}', type: 'TagsInput', options: ['Username', 'Password', 'Phone', 'TOTP'] },
			{ name: 'required', label: '{#Required#}', type: 'switch' },
			{ name: 'pattern', label: '{#Validation Pattern#}', type: 'text', setting: { placeholder: '{#Regular expression, e.g. ^[A-Z].+$#}' } },
			{ name: 'db_type', label: '{#Database Type#}', type: 'dbtype', setting: { required: true } },
			{ name: 'index', label: '{#Index#}', type: 'select', options: [{ label: '{#None#}', value: '' }, { label: 'Index', value: 'Index' }, { label: 'Unique', value: 'Unique' }, { label: 'FullText', value: 'FullText' }] },
			{ name: 'protection', label: '{#Protection#}', type: 'select', options: [{ label: '{#None#}', value: '' }, { label: 'Sensitive', value: 'Sensitive' }, { label: 'Secret', value: 'Secret' }, { label: 'Verifier', value: 'Verifier' }] },
			{ name: 'memo', label: '{#Memo#}', type: 'text' },
			{ name: 'attrs_json', label: '{#Settings#}', type: 'textarea', setting: { rows: 3, placeholder: '{"minlength":2,"maxlength":100}' } },
			{ name: 'if_expr', label: '{#Display Condition#}', type: 'text', setting: { placeholder: 'this.data.role === "admin"' } }
		] : [];
		const auditSchema = state.advancedMode ? [
			{ type: 'divider', label: '{#System Information#}' },
			{ name: 'id', label: '{#Field ID#}', type: 'label' }, { name: 'tableID', label: '{#Table ID#}', type: 'label' },
			{ name: 'creator', label: '{#Creator#}', type: 'label' }, { name: 'createTime', label: '{#Create Time#}', type: 'label' },
			{ name: 'updater', label: '{#Updater#}', type: 'label' }, { name: 'updateTime', label: '{#Update Time#}', type: 'label' }
		] : [];
		return baseSchema.concat(dynamicSchema, advancedSchema, auditSchema);
	};
	state.__watch('fieldAdvanced', () => {
		const form = container.querySelector(`Modal[id="${container.id}_field_modal"] AutoForm`);
		if (form) form.state.schema = getFieldSchema();
	});

	const parseOptionsStr = (str) => {
		if (!str) return undefined;
		return str.split('\n').map(s => s.trim()).filter(Boolean).map(line => {
			const idx = line.indexOf(':'); if (idx > -1) return { label: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() }; return line;
		});
	};
	const formatOptionsStr = (opts) => { if (!opts) return ''; return opts.map(o => typeof o === 'object' ? `${o.label}:${o.value}` : o).join('\n'); };
	const parseAttrsJSON = value => {
		const attrs = JSON.parse(String(value || '{}'));
		if (!attrs || Array.isArray(attrs) || typeof attrs !== 'object') throw new Error('{#Control Attributes must be a JSON object#}');
		delete attrs.required; delete attrs.pattern;
		return attrs;
	};
	const formatAttrsJSON = attrs => {
		const settings = { ...(attrs || {}) };
		delete settings.required; delete settings.pattern;
		return JSON.stringify(settings, null, 2);
	};
	const normalizePattern = value => {
		const pattern = String(value || '').trim();
		if (!pattern) return undefined;
		try { new RegExp(pattern); return pattern; }
		catch (_) { throw new Error('{#Validation Pattern must be a valid regular expression#}'); }
	};
	const normalizeIndex = value => ({ index: 'Index', unique: 'Unique', fulltext: 'FullText' }[String(value || '').toLowerCase()] || '');
	const normalizeProtection = (value, legacySecret = false) => ({ sensitive: 'Sensitive', secret: 'Secret', verifier: 'Verifier' }[String(value || '').toLowerCase()] || (legacySecret ? 'Secret' : ''));
	const bindFieldTypeDefaults = (form, data) => {
		setTimeout(() => {
			const typeInput = form.querySelector('select[name="user_type"]');
			const dbTypeInput = form.querySelector('[name="db_type"]');
			const decimalsInput = form.querySelector('input[name="decimals"]');
			const applyDefault = () => { if (data._dbTypeAuto) data.db_type = getDefaultDbType(data.user_type, data.decimals); };
			typeInput?.addEventListener('change', () => { data._dbTypeAuto = true; applyDefault(); });
			dbTypeInput?.addEventListener('change', () => { data._dbTypeAuto = false; });
			decimalsInput?.addEventListener('input', applyDefault);
		});
	};
	container.finishFieldDialog = result => {
		const dialog = container.querySelector(`Modal[id="${container.id}_field_modal"]`);
		if (!dialog) return;
		if (result === 1) { dialog.dirty = false; dialog.hide(); }
		dialog.dispatchEvent(new CustomEvent('fieldresult', { detail: result }));
	};

	container.addField = async () => {
		if (state.readonly) return;
		container.hideColumnMenu();
		const data = globalThis.NewState({ id: 'c' + Date.now().toString().slice(-4), tableID: state.fields[0]?.tableID || '', creator: '', createTime: '', updater: '', updateTime: '', name: '', _editing: false, user_type: 'text', pinned: '', db_type: getDefaultDbType('text'), _dbTypeAuto: true, decimals: 0, index: '', protection: '', semantics: [], required: false, pattern: '', memo: '', options_str: '', attrs_json: '{}', if_expr: '' });
		const d = container.querySelector(`Modal[id="${container.id}_field_modal"]`);
		if (!d) return;
		Object.assign(d.state, { title: '{#Add Field#}', buttons: ['{#Cancel#}', '{#Save#}'] });
		state.fieldAdvanced = false;
		const form = d.querySelector('AutoForm');
		if (form) {
			form.state.data = data; form.state.schema = getFieldSchema(); bindFieldTypeDefaults(form, data);
		}
		d.show();
		const result = await new Promise(resolve => d.addEventListener('fieldresult', event => resolve(event.detail), { once: true }));
		if (result === 2) {
			const dbType = normalizeDBType(data.db_type, getDefaultDbType(data.user_type, data.decimals));
			let pattern; try { pattern = normalizePattern(data.pattern); } catch (error) { globalThis.Toast?.show(error.message, { type: 'danger' }); return; }
			const semantics = [...new Set(data.semantics || [])], password = semantics.includes('Password'), username = semantics.includes('Username');
			const protection = password ? 'Verifier' : normalizeProtection(data.protection);
			const field = { id: data.id, tableID: data.tableID, name: data.name, memo: data.memo, index: username ? 'Unique' : normalizeIndex(data.index), protection, isSecret: !!protection, type: dbType, settings: { type: password ? 'password' : data.user_type, semantics, pinned: data.pinned || undefined, required: !!data.required, pattern, decimals: data.decimals, prefix: data.prefix, suffix: data.suffix, thousandSep: data.thousandSep, labelOn: data.labelOn, labelOff: data.labelOff, format: data.format, placeholder: data.placeholder, options: parseOptionsStr(data.options_str), attrs: parseAttrsJSON(data.attrs_json), if: data.if_expr?.trim() || undefined } };
			if (container.apiUrl) { try { await requestApi('setField', { fields: [field] }); } catch (_) { return; } }
			state.fields = [...state.fields, field]; state.isDirty = !container.apiUrl; container.dispatchEvent(new CustomEvent('savefields', { detail: state.fields })); state.list = [...state.list];
			d.dirty = false; d.hide();
		}
	};

	container.editField = async () => {
		if (state.readonly) return;
		if (!state.activeField) return;
		container.hideColumnMenu();
		const f = state.activeField; const s = f.settings || {};
		const data = globalThis.NewState({ id: f.id, tableID: f.tableID || '', creator: f.creator || '', createTime: f.createTime || '', updater: f.updater || '', updateTime: f.updateTime || '', name: f.name, _editing: true, pinned: s.pinned || f.pinned || '', memo: f.memo || '', index: normalizeIndex(f.index), protection: normalizeProtection(f.protection, !!f.isSecret), semantics: [...(s.semantics || [])], required: !!(s.required || s.attrs?.required), pattern: s.pattern || s.attrs?.pattern || '', user_type: getEditorType(f), db_type: f.type || '', _dbTypeAuto: true, decimals: s.decimals || 0, prefix: s.prefix || '', suffix: s.suffix || '', thousandSep: !!s.thousandSep, labelOn: s.labelOn || '', labelOff: s.labelOff || '', format: s.format || '', placeholder: s.placeholder || '', options_str: formatOptionsStr(s.options), attrs_json: formatAttrsJSON(s.attrs), if_expr: s.if || f.if || '' });
		const d = container.querySelector(`Modal[id="${container.id}_field_modal"]`);
		if (!d) return;
		Object.assign(d.state, { title: '{#Edit Field#}', buttons: ['{#Cancel#}', '{#Save#}'] });
		state.fieldAdvanced = false;
		const form = d.querySelector('AutoForm');
		if (form) {
			form.state.data = data; form.state.schema = getFieldSchema(); bindFieldTypeDefaults(form, data);
		}
		d.show();
		const result = await new Promise(resolve => d.addEventListener('fieldresult', event => resolve(event.detail), { once: true }));
		if (result === 2) {
			const idx = state.fields.findIndex(item => item.id === f.id);
			if (idx !== -1) {
				// Preserve exact database definitions such as v30 when the
				// editor is unchanged; only a UI-type switch gets a default.
				const dbType = normalizeDBType(data.db_type, data.user_type === getEditorType(f) ? normalizeDBType(f.type) : getDefaultDbType(data.user_type, data.decimals));
				let pattern; try { pattern = normalizePattern(data.pattern); } catch (error) { globalThis.Toast?.show(error.message, { type: 'danger' }); return; }
				const semantics = [...new Set(data.semantics || [])], password = semantics.includes('Password'), username = semantics.includes('Username');
				const protection = password ? 'Verifier' : normalizeProtection(data.protection);
				const updatedField = { ...f, name: data.name, memo: data.memo, index: username ? 'Unique' : normalizeIndex(data.index), protection, isSecret: !!protection, type: dbType, settings: { ...f.settings, type: password ? 'password' : data.user_type, semantics, pinned: data.pinned || undefined, required: !!data.required, pattern, decimals: data.decimals, prefix: data.prefix, suffix: data.suffix, thousandSep: data.thousandSep, labelOn: data.labelOn, labelOff: data.labelOff, format: data.format, placeholder: data.placeholder, options: parseOptionsStr(data.options_str), attrs: parseAttrsJSON(data.attrs_json), if: data.if_expr?.trim() || undefined } };
				if (container.apiUrl) { try { await requestApi('setField', { fields: [updatedField] }); } catch (_) { return; } }
				state.fields[idx] = updatedField; state.fields = [...state.fields]; state.isDirty = !container.apiUrl; container.dispatchEvent(new CustomEvent('savefields', { detail: state.fields })); state.list = [...state.list];
				d.dirty = false; d.hide();
			}
		}
	};

	container.deleteField = async () => {
		if (state.readonly) return;
		if (!state.activeField) return;
		container.hideColumnMenu();
		if (state.activeField.system) return;
		if (await globalThis.Dialog.confirm(`{#Are you sure you want to delete field "{field}"?||${state.activeField.name}#}`)) {
			const idx = state.fields.findIndex(f => f.id === state.activeField.id);
			if (idx !== -1) {
				if (container.apiUrl) { try { await requestApi('removeField', { fields: [state.activeField] }); } catch (_) { return; } }
				state.fields.splice(idx, 1); state.fields = [...state.fields]; state.isDirty = !container.apiUrl; container.dispatchEvent(new CustomEvent('savefields', { detail: state.fields })); state.list = [...state.list];
			}
		}
	};

	window.addEventListener('mouseup', selection.endSelect);
	document.addEventListener('mousedown', e => {
		const overlay = container.querySelector('.dt-editor-overlay'); const menu = container.querySelector('.dt-column-menu');
		if (overlay?.style.display !== 'none' && !overlay.contains(e.target)) setTimeout(() => container.hideEditor(true));
		if (!container.contains(e.target) && !overlay?.contains(e.target) && !menu?.contains(e.target)) selection.clearAllActive();
	});

	container.addEventListener('keydown', e => {
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
			e.preventDefault();
			selection.copy();
		}
		if (!state.readonly && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
			e.preventDefault();
			selection.paste();
		}
	});

	state._MODE_ICONS = MODE_ICONS;
	state._MODE_LABELS = MODE_LABELS;
}, globalThis.Util.makeDom(/*html*/`
<div class="dt-root d-flex flex-column h-100 w-100 bg-body text-body overflow-hidden" style="position:relative; user-select:none; outline: none; min-height: 0" tabindex="0">
		<div class="dt-main flex-grow-1 overflow-auto" $onscroll="this.onScroll()" 
                $onmousedown="this.onMainMouseDown(event)" $onmouseover="this.onMainMouseOver(event)" $ondblclick="this.onMainDblClick(event)"
                style="overflow-anchor:none; min-height: 0">
                <div class="dt-header border-bottom bg-body-tertiary sticky-top" style="z-index:20; background-color: var(--bs-tertiary-bg) !important;">
                        <div class="dt-header-row fw-bold text-muted small">
                                <template $each="this.state?._displayFields || []">
						<div $data-id="item.id" $ondragover="event.preventDefault()" $ondrop="this.onFieldDrop(item,event)" $class="dt-cell dt-col border-end d-flex align-items-center header-cell \${item.system ? 'text-secondary' : ''} \${(item.settings?.pinned || item.pinned) ? 'pinned-' + (item.settings?.pinned || item.pinned) : ''}" $style="((item.settings?.pinned || item.pinned) ? 'position: sticky; z-index: 11; background-color: var(--bs-tertiary-bg); ' : 'position:relative; ') + 'padding: 0; ' + ((item.settings?.pinned || item.pinned) === 'left' ? 'left: var(--l-' + item.id + '); border-right: 1px solid var(--bs-border-color); box-shadow: 2px 0 5px -2px rgba(0,0,0,0.1);' : ((item.settings?.pinned || item.pinned) === 'right' ? 'right: var(--r-' + item.id + '); border-left: 1px solid var(--bs-border-color); box-shadow: -2px 0 5px -2px rgba(0,0,0,0.1);' : ''))">
								<div draggable="true" $ondragstart="this.onFieldDragStart(item,event)" $onclick="this.showColumnMenu(item, event)" class="d-flex align-items-center overflow-hidden flex-grow-1 h-100 px-2 cursor-grab">
                                                        <i $if="this.state?.filterConfig?.[item.id] && (this.state.filterConfig[item.id].value || this.state.filterConfig[item.id].selectedValues?.length)" class="bi bi-filter me-1 text-primary"></i>
                                                        <i $if="this.state?.sortConfig?.fieldId === item.id && this.state.sortConfig.direction" $class="bi bi-sort-\${this.state.sortConfig.direction === 'asc' ? 'down' : 'up-alt'} me-1 text-primary"></i>
										<span $class="text-truncate flex-grow-1 \${item.rowOrder ? 'd-flex align-items-center justify-content-center' : ''}"><i $if="item.rowOrder" class="bi bi-list" title="{#Row order#}"></i><span $if="!item.rowOrder" $text="item.settings?.label || item.name"></span></span>
                                                </div>
				<button $if="!item.rowOrder" class="btn btn-link text-muted p-0 border-0 me-1 header-menu-btn" $onclick="this.showColumnMenu(item, event)"><i class="bi bi-chevron-down"></i></button>
								<Resizer $.target="thisNode.parentElement" style="position:absolute; right:0; top:0; bottom:0; width:4px; z-index:10" min="50" max="1000" $onmousedown="event.stopPropagation()" $ondragstart="event.preventDefault();event.stopPropagation()" $onresizing="this.onColumnResizing(item, event)" $onresize="this.onColumnResize(item, event)"></Resizer>
                                        </div>
                                </template>
                                </div>
                </div>
                <div class="dt-body" style="position:relative">
                        <div class="dt-spacer-prev flex-shrink-0" style="display:none"></div>
                        <template $each="this.state?._renderedList || []" key="id" index="rIdx">
				<div class="dt-row dt-body-row bg-body" $.="this._initRow(thisNode)" $ondragover="this.onRowDragOver(item,event)" $ondragleave="if(!thisNode.contains(event.relatedTarget))thisNode.classList.remove('dt-drop-row')" $ondrop="this.onRowDrop(item,event)">
				<template $each="this.state?._displayFields || []" as="f" index="fIdx" key="id"><div $data-fidx="fIdx" $class="dt-cell border-end px-2 d-flex align-items-center \${f.system ? 'text-secondary' : ''} \${(f.settings?.pinned || f.pinned) ? 'pinned-' + (f.settings?.pinned || f.pinned) : ''}" $style="((f.settings?.pinned || f.pinned) ? 'position: sticky; z-index: 1; background-color: var(--bs-body-bg); ' : '') + ((f.settings?.pinned || f.pinned) === 'left' ? 'left: var(--l-' + f.id + '); border-right: 1px solid var(--bs-border-color); box-shadow: 2px 0 5px -2px rgba(0,0,0,0.1);' : ((f.settings?.pinned || f.pinned) === 'right' ? 'right: var(--r-' + f.id + '); border-left: 1px solid var(--bs-border-color); box-shadow: -2px 0 5px -2px rgba(0,0,0,0.1);' : ''))"><span $if="f.rowOrder" draggable="true" $onmousedown="event.stopPropagation()" $ondragstart="this.onRowDragStart(item,event)" $ondrop="this.onRowDrop(item,event)" $class="d-flex align-items-center justify-content-center w-100 h-100 \${this.canReorderRows() ? 'text-muted cursor-grab' : 'text-body-tertiary'}"><i class="bi bi-list"></i></span><input $if="!f.rowOrder && !f.settings?.cellSlot && this.getEditorType(f)==='switch'" class="form-check-input mt-0" type="checkbox" $checked="!!item[this.getDataKey(f)]" $disabled="this.state?.readonly" $onchange="this.toggleSwitchCell(item,f,event)"><span $if="!f.rowOrder && !f.settings?.cellSlot && this.getEditorType(f)!=='switch'" $text="this.protectedCellValue(item, f)" class="text-truncate flex-grow-1"></span><button $if="!f.rowOrder && !f.settings?.cellSlot && Object.hasOwn(this.state._revealedValues, this.protectedCellKey(item,f))" type="button" class="btn btn-link p-0 border-0 ms-1 lh-1" title="{#Copy protected value#}" $onclick="this.copyProtectedValue(item,f,event)"><i class="bi bi-copy"></i></button><button $if="!f.rowOrder && !f.settings?.cellSlot && this.canRevealProtectedValue(item,f)" type="button" class="btn btn-link p-0 border-0 ms-1 lh-1" title="{#Reveal protected value#}" $onclick="this.toggleProtectedValue(item,f,event)"><i $class="Object.hasOwn(this.state._revealedValues, this.protectedCellKey(item,f)) ? 'bi bi-eye-slash' : 'bi bi-eye'"></i></button><div $if="!f.rowOrder && f.settings?.cellSlot" class="w-100 min-w-0"><div slot-id="cell"></div></div></div></template>
                                </div>
                        </template>
                        <div class="dt-spacer-post flex-shrink-0" style="display:none"></div>
                </div>
                <div class="dt-editor-overlay dt-editor-container" style="display: none; position: absolute; z-index: 1000; background: var(--bs-body-bg); box-shadow: 0 4px 16px rgba(0,0,0,0.25); border: 1px solid var(--bs-primary); padding: 0;"><AutoForm nobutton inline class="h-100 w-100" $onsubmit="event.preventDefault(); thisNode.closest('DataGrid').hideEditor(true)"></AutoForm></div>
        </div>

        <div class="dt-column-menu bg-body shadow-lg rounded p-2" style="display:none; position:absolute; z-index:2000; min-width:240px; max-width:300px; border: 1px solid var(--bs-border-color)">
                <template $if="this.state?.activeFieldId">
                        <div class="d-flex gap-1 mb-2">
                                <button $class="btn flex-grow-1 d-flex align-items-center justify-content-center \${this.state?.sortConfig?.direction === 'asc' && this.state?.sortConfig?.fieldId === this.state?.activeFieldId ? 'btn-primary' : 'btn-outline-secondary border'}" $onclick="this.setSort('asc')"><i class="bi bi-sort-alpha-down me-1"></i> {#ASC#}</button>
                                <button $class="btn flex-grow-1 d-flex align-items-center justify-content-center \${this.state?.sortConfig?.direction === 'desc' && this.state?.sortConfig?.fieldId === this.state?.activeFieldId ? 'btn-primary' : 'btn-outline-secondary border'}" $onclick="this.setSort('desc')"><i class="bi bi-sort-alpha-up-alt me-1"></i> {#DESC#}</button>
                        </div>

                        <template $if="this.state?.activeModes?.length">
                        <div class="py-2 border-bottom" style="min-height: 48px">
                                <div class="input-group  mb-1">
					<input type="text" class="form-control" $placeholder="(this.state?._MODE_LABELS?.[this.state?.filterConfig?.[this.state?.activeFieldId]?.mode] || '{#Search#}') + '...'" $bind="this.state.filterConfig[this.state.activeFieldId].value" $oninput="this.deferSortFilter()" $onkeydown="if(event.key==='Enter'){clearTimeout(this._sortFilterTimer);this.applySortFilter();this.hideColumnMenu();}">
								<button class="btn btn-outline-secondary border dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" title="{#Search Mode#}">
                                                <i $class="bi \${this.state?._MODE_ICONS?.[this.state?.filterConfig?.[this.state?.activeFieldId]?.mode] || 'bi-filter'}"></i>
                                        </button>
                                        <ul class="dropdown-menu dropdown-menu-end shadow">
                                                <template $each="this.state?.activeModes || []" as="m">
                                                        <li><button class="dropdown-item d-flex align-items-center" type="button" $onclick="this.state.filterConfig[this.state.activeFieldId].mode = m; this.state.filterConfig = {...this.state.filterConfig}">
								<i $class="bi \${this.state?._MODE_ICONS?.[m] || 'bi-filter'} me-2"></i> <span $text="this.state?._MODE_LABELS?.[m] || m.toUpperCase()"></span>
                                                        </button></li>
                                                </template>
                                        </ul>
                                </div>
								<input $if="this.state?.filterConfig?.[this.state?.activeFieldId]?.mode === 'between'" type="text" class="form-control " placeholder="{#And...#}" $bind="this.state.filterConfig[this.state.activeFieldId].value2" $oninput="this.deferSortFilter()" $onkeydown="if(event.key==='Enter'){clearTimeout(this._sortFilterTimer);this.applySortFilter();this.hideColumnMenu();}">
                        </div>
                        </template>

                        <div class="mt-2" style="max-height: 180px; overflow-y: auto;">
                                <template $each="this.state?._columnStats?.[this.state?.activeFieldId] || []">
                                        <label class="d-flex align-items-center mb-1 small cursor-pointer p-1 rounded-1 menu-item-row" onmouseover="this.style.background='var(--bs-light)'" onmouseout="this.style.background='transparent'">
										<input type="checkbox" class="form-check-input me-2" $checked="this.state?.filterConfig?.[this.state?.activeFieldId]?.selectedValues?.includes(String(item.val))" $onchange="this.toggleSelectedValue(String(item.val))">
										<span class="text-truncate flex-grow-1"><span $text="item.val || '{#(Empty)#}'"></span> <span class="text-muted ms-1" style="font-size: 0.7rem" $text="'(' + item.count + ')'"></span></span>
										<button class="btn btn-link p-0 text-primary only-btn" style="font-size: 10px; text-decoration: none" $onclick="this.filterOnlyThis(item.val); event.preventDefault(); event.stopPropagation();">{#Only#}</button>
                                        </label>
                                </template>
                        </div>

                        <div $if="this.state?.filterConfig?.[this.state?.activeFieldId]?.value || this.state?.filterConfig?.[this.state?.activeFieldId]?.selectedValues?.length" class="mt-2 pt-1 border-top text-center">
				<span class="cursor-pointer text-primary small fw-bold" $onclick="this.clearColumnSettings()"><i class="bi bi-x-circle me-1"></i> {#Clear Filter#}</span>
                        </div>

                        <div $if="this.state?.editable && !this.state?.readonly && !this.state?.activeField?.system" class="mt-3 pt-2 border-top d-flex gap-1 justify-content-between">
				<button class="btn btn-outline-secondary border-0 flex-grow-1" title="{#Edit Field#}" $onclick="this.editField()"><i class="bi bi-pencil"></i></button>
				<button class="btn btn-outline-secondary border-0 flex-grow-1" title="{#Add Field#}" $onclick="this.addField()"><i class="bi bi-plus-lg"></i></button>
				<button class="btn btn-outline-secondary border-0 flex-grow-1 text-danger" title="{#Delete Field#}" $onclick="this.deleteField()"><i class="bi bi-trash"></i></button>
                        </div>
                </template>
        </div>

		<Modal class="datagrid-field-modal" $.id="this.id + '_field_modal'" guard-dirty>
            <div slot="body"><AutoForm nobutton class="p-3"></AutoForm></div>
			<div slot="footer" class="d-flex align-items-center w-100">
				<label class="small me-auto mb-0"><input class="form-check-input me-1" type="checkbox" data-no-dirty $bind="thisNode.closest('DataGrid').state.fieldAdvanced">{#Advanced mode#}</label>
                <button type="button" class="btn btn-secondary" $onclick="thisNode.closest('DataGrid').finishFieldDialog(1)">{#Cancel#}</button>
                <button type="button" class="btn btn-primary ms-2" $onclick="thisNode.closest('DataGrid').finishFieldDialog(2)">{#Save#}</button>
            </div>
		</Modal>

		<Modal class="datagrid-row-modal" $.id="this.id + '_row_modal'" .title="{#Edit Row#}">
			<div slot="body"><AutoForm nobutton class="p-3" $oninput="thisNode.closest('DataGrid').rowFormChanged()" $onchange="thisNode.closest('DataGrid').rowFormChanged()"></AutoForm></div>
			<div slot="footer" class="d-flex align-items-center w-100">
				<span class="small text-muted me-auto" $text="((thisNode.closest('DataGrid').state.rowFormIndex ?? -1) + 1) + ' / ' + (thisNode.closest('DataGrid').state.list?.length || 0)"></span>
				<button class="btn btn-outline-secondary" $disabled="thisNode.closest('DataGrid').state.rowFormIndex <= thisNode.closest('DataGrid').state.rowFormMin" $onclick="const grid=thisNode.closest('DataGrid');grid.showRowFormAt(grid.state.rowFormIndex-1)"><i class="bi bi-arrow-left"></i> {#Previous#}</button>
				<button class="btn btn-outline-secondary" $disabled="thisNode.closest('DataGrid').state.rowFormIndex >= thisNode.closest('DataGrid').state.rowFormMax" $onclick="const grid=thisNode.closest('DataGrid');grid.showRowFormAt(grid.state.rowFormIndex+1)">{#Next#} <i class="bi bi-arrow-right"></i></button>
				<button class="btn btn-secondary" $onclick="thisNode.closest('Modal').hide(true)">{#Close#}</button>
			</div>
		</Modal>

		<Modal class="datagrid-cell-detail-modal" size="lg">
			<div slot="header" class="modal-header"><h6 class="modal-title" $text="thisNode.closest('DataGrid').state.cellDetailTitle"></h6><button type="button" class="btn-close" aria-label="{#Close#}" $onclick="thisNode.closest('Modal').hide()"></button></div>
			<div slot="body"><pre class="text-wrap text-break m-0 p-3" $text="thisNode.closest('DataGrid').state.cellDetailValue"></pre></div>
			<div slot="footer"><button type="button" class="btn btn-secondary" $onclick="thisNode.closest('Modal').hide()">{#Close#}</button></div>
		</Modal>

		<Modal class="datagrid-reveal-modal" guard-dirty .title="{#Reveal protected value#}">
			<div slot="body" class="p-3"><label class="form-label">{#Reason#}</label><textarea class="form-control" rows="3" required $bind="thisNode.closest('DataGrid').state.revealReason"></textarea></div>
			<div slot="footer"><button type="button" class="btn btn-secondary" $onclick="thisNode.closest('Modal').hide(true)">{#Cancel#}</button><button type="button" class="btn btn-primary ms-2" $disabled="!thisNode.closest('DataGrid').state.revealReason?.trim()" $onclick="thisNode.closest('DataGrid').submitProtectedReveal()"><i class="bi bi-eye me-1"></i>{#Reveal#}</button></div>
		</Modal>

		<div $if="!this.hasAttribute('notoolbar')" class="dt-toolbar border-bottom bg-body d-flex align-items-center px-3 py-1 shadow-sm text-nowrap" $.="this.ensureFooterHost(thisNode)" style="position:absolute; left:0; right:0; top:0; height:48px; z-index:30; overflow:hidden">
                <div class="d-flex flex-wrap align-items-center flex-grow-1" style="min-width:0;gap:var(--ui-gap,.5rem)">
                        <div slot-id="toolbar-start" class="d-flex align-items-center gap-2"></div>
					<div class="d-flex align-items-center gap-1 text-muted me-3" style="font-size: 0.75rem">
								<button type="button" class="btn btn-link p-0 border-0 lh-1" $onclick="this.state?.selectedRowCount ? this.clearSelection() : this.selectAllRows()" $title="this.state?.selectedRowCount ? '{#Clear Selection#}' : '{#Select All Rows#}'" aria-label="{#Toggle all rows selection#}"><i $class="this.state?.selectedRowCount ? 'bi bi-check-all fs-6 text-warning' : 'bi bi-check-all fs-6'"></i></button><span $text="this.state?.selectedRowCount || 0"></span><span>/</span><span $text="this.apiUrl ? (this.state?.total || 0) : (this.state?.list?.length || 0)"></span>
					</div>
                        <div $if="this.state?.editable && !this.state?.readonly" class="d-flex align-items-center gap-1 me-3">
				<button class="btn btn-outline-secondary border-0 d-flex align-items-center px-2 py-1" $onclick="this.addRow()" title="{#Add Row#}"><i class="bi bi-plus-lg text-primary"></i><span class="dt-toolbar-label ms-1">{#Add#}</span></button>
				<button class="btn btn-outline-secondary border-0 d-flex align-items-center px-2 py-1" $onclick="this.addField()" title="{#Add Field#}"><i class="bi bi-layout-three-columns text-primary"></i><span class="dt-toolbar-label ms-1">{#Field#}</span></button>
				<button class="btn btn-outline-secondary border-0 d-flex align-items-center px-2 py-1" $onclick="this.editSelectedRows()" $disabled="!this.state?.selectedRowCount" title="{#Edit Selected Rows#}"><i class="bi bi-pencil text-primary"></i><span class="dt-toolbar-label ms-1">{#Edit#}</span></button>
				<button class="btn btn-outline-secondary border-0 d-flex align-items-center px-2 py-1" $onclick="this.deleteSelectedRow()" $disabled="!this.state?.selectedRowCount" title="{#Delete Selected Rows#}"><i class="bi bi-trash text-danger"></i><span class="dt-toolbar-label ms-1">{#Delete#}</span></button>
                        </div>
							<label $if="this.state?.showAdvanced" class="small d-flex align-items-center mb-0 text-nowrap me-3" title="{#System Fields#}"><input class="form-check-input" type="checkbox" $bind="this.state.advancedMode"><i class="bi bi-eye mx-1 dt-toolbar-icon"></i><span class="dt-toolbar-label ms-1">{#System Fields#}</span></label>
							<div slot-id="footer-start" class="d-flex align-items-center gap-2 me-3"></div>
                </div>
				<div slot-id="toolbar-end" class="d-flex align-items-center gap-2"></div>
				<div slot-id="footer-end" class="d-flex align-items-center gap-2"></div>
                <div $if="this.state?.editable && !this.state?.readonly" class="d-flex align-items-center gap-2">
		<button class="btn btn-primary px-3 ms-2" $disabled="!this.state?.isDirty" $onclick="this.saveChanges()"><i class="bi bi-floppy me-1"></i>{#Save#}<span $if="this.getChangedRowCount()" $text="'(' + this.getChangedRowCount() + ')'" ></span></button>
                </div>
        </div>
</div>
`), globalThis.Util.makeDom(/*html*/`
<style>
		DataGrid { display: block; }
		.dt-editor-overlay.dt-editor-code { width:min(760px, calc(100vw - 2rem)) !important; border:1px solid var(--bs-border-color) !important; }
		.modal.datagrid-field-modal .modal-dialog, .modal.datagrid-row-modal .modal-dialog { width:min(920px, calc(100vw - 2rem)); max-width:none; }
		.modal.datagrid-field-modal .modal-content, .modal.datagrid-row-modal .modal-content { border:1px solid var(--bs-border-color); border-radius:.375rem; box-shadow:0 .5rem 1.5rem rgba(0,0,0,.18); }
        .dt-root { font-size: var(--ui-item-font,1rem); }
		.dt-row, .dt-header-row { display: grid; grid-template-columns: var(--dt-grid-template); width: var(--dt-row-width, max-content); min-width: 0; height: var(--ui-grid-row,40px); box-sizing: content-box; position: relative; }
		DataGrid, .dt-root { width: 100%; min-width: 0; max-width: 100%; overflow: hidden !important; }
		.dt-main { position: relative; min-height: 0; min-width: 0; width: 100%; max-width: 100%; flex: 1 1 auto; padding-top: 0; overflow-x: auto; overflow-y: auto; }
		.dt-toolbar { position: relative !important; order: -1; inset: auto !important; flex: 0 0 auto; min-height:var(--ui-toolbar-height,48px);height:auto !important;flex-wrap:wrap;gap:var(--ui-gap,.5rem); overflow: visible !important; }
		.dt-header-row { background-color: rgba(var(--bs-secondary-rgb), 0.08); }
		.dt-body-row { background-color: rgba(var(--bs-secondary-rgb), 0.08) !important; cursor: pointer; }
		.dt-body-row .dt-cell { background-color: var(--bs-body-bg); cursor: default; border-bottom: 1px solid var(--bs-border-color); }
		.dt-header-row .dt-cell { background-color: var(--bs-tertiary-bg); cursor: default; border-bottom: 1px solid var(--bs-border-color); }
		.dt-cell { white-space: nowrap; flex-shrink: 0; contain: content; }
		.dt-toolbar-icon { display: none; }
		@media (max-width: 1100px) { .dt-toolbar-label { display: none; } .dt-toolbar-icon { display: inline-block; } .dt-toolbar { padding-left: .5rem !important; padding-right: .5rem !important; } .dt-toolbar .gap-3 { gap: .5rem !important; } }
        .dt-cell-selected { background-color: rgba(var(--bs-primary-rgb), 0.15) !important; outline: 1px solid var(--bs-primary); outline-offset: -1px; }
		.dt-body-row:hover { background-color: var(--bs-secondary-bg) !important; }
		.dt-cell-changed { color: var(--bs-warning-text-emphasis) !important; background-color: var(--bs-warning-bg-subtle) !important; }
		.dt-drop-before { box-shadow: inset 3px 0 0 var(--bs-primary) !important; }
		.dt-body-row.dt-drop-row { position: relative; box-shadow: none !important; }
		.dt-body-row.dt-drop-row::after { content: ''; position: absolute; inset: 0; z-index: 30; pointer-events: none; border-top: 3px solid var(--bs-primary); }
        .dt-drag-preview { background-color: var(--bs-body-bg); color: var(--bs-body-color); border-color: var(--bs-primary) !important; }
        .header-cell .header-menu-btn { opacity: 0; transition: opacity 0.2s; }
        .header-cell:hover .header-menu-btn { opacity: 1; }
        .dt-column-menu { background-color: var(--bs-body-bg); border: 1px solid var(--bs-border-color); box-shadow: 0 10px 40px rgba(0,0,0,0.2) !important; z-index: 2100 !important; }
        .{ padding: 1px 5px; line-height: 1.5; }
		.cursor-pointer { cursor: pointer; }
		.cursor-grab { cursor: grab; }
        .dt-filter-tabs i { font-size: 1.1rem; }
        .dt-filter-tabs div:hover i { color: var(--bs-primary); }
        .menu-item-row .only-btn { opacity: 0; }
        .menu-item-row:hover .only-btn { opacity: 1; }
        .dt-editor-overlay .auto-form-root form { gap: 0 !important; margin: 0 !important; height: 100%; }
        .dt-editor-overlay [control-wrapper] { width: 100%; margin: 0 !important; min-height: 100% !important; align-items: stretch !important; }
        .dt-editor-overlay.dt-editor-code [control-wrapper] { height: 100%; }
		.dt-editor-overlay.dt-editor-simple [control-wrapper] { height: 100%; }
		.dt-editor-overlay:not(.dt-editor-code) input.form-control { height: 100%; padding: 0 .5rem; border: 0; border-radius: 0; font: inherit; }
        .dt-editor-overlay [control-wrapper] > .d-flex { padding: 0.375rem 0.5rem; justify-content: flex-start !important; align-items: center !important; }
        .dt-editor-overlay [control-wrapper] > .form-switch { padding-left: 2.5rem !important; }
        .dt-editor-overlay [control-wrapper] > textarea { min-height: 100px; resize: vertical; }
</style>
`))

globalThis.DataGrid = DataGridConfig;
