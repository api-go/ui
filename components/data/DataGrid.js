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

const DataGridConfig = {
        _fieldTypes: new Map(),
        registerFieldType: (config) => {
                DataGridConfig._fieldTypes.set(config.value, config);
        },
        getFieldTypes: () => Array.from(DataGridConfig._fieldTypes.values())
};

// Register Built-in Types
DataGridConfig.registerFieldType({
        value: 'text', label: '{#Text#}', typeForDB: 'v4096',
        schema: [{ name: 'placeholder', label: 'Placeholder', type: 'text', if: 'this.data.user_type=="text"' }]
});
DataGridConfig.registerFieldType({
        value: 'number', label: '{#Number#}', typeForDB: 'ff',
        schema: [
                { name: 'decimals', label: 'Decimals', type: 'number', setting: { min: 0, max: 10 }, if: 'this.data.user_type=="number"' },
                { name: 'prefix', label: 'Prefix (e.g. $)', type: 'text', if: 'this.data.user_type=="number"' },
                { name: 'suffix', label: 'Suffix (e.g. %)', type: 'text', if: 'this.data.user_type=="number"' },
                { name: 'thousandSep', label: 'Thousand Sep', type: 'switch', if: 'this.data.user_type=="number"' }
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
        value: 'select', label: '{#Single Select#}', typeForDB: 'v1024',
        schema: [{ name: 'options_str', label: 'Options', type: 'textarea', setting: { rows: 3, placeholder: 'Label:Value per line' }, if: 'this.data.user_type=="select"' }],
        formatter: (val, field) => {
                if (val == null || val === '') return '';
                const opts = field.settings?.options || [];
                const opt = opts.find(o => typeof o === 'object' ? o.value == val : o == val);
                return opt ? (typeof opt === 'object' ? opt.label : opt) : val;
        }
});
DataGridConfig.registerFieldType({
        value: 'checkbox', label: '{#Multi Select#}', typeForDB: 'v4096',
        schema: [{ name: 'options_str', label: 'Options', type: 'textarea', setting: { rows: 3, placeholder: 'Label:Value per line' }, if: 'this.data.user_type=="checkbox"' }],
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
                { name: 'labelOn', label: 'Label On', type: 'text', if: 'this.data.user_type=="switch"' },
                { name: 'labelOff', label: 'Label Off', type: 'text', if: 'this.data.user_type=="switch"' }
        ],
        formatter: (val, field) => {
                const s = field.settings || {};
                return val ? (s.labelOn || 'Yes') : (s.labelOff || 'No');
        }
});
DataGridConfig.registerFieldType({
        value: 'datetime', label: '{#DateTime#}', typeForDB: 'dt',
        schema: [{ name: 'format', label: 'Format', type: 'text', setting: { placeholder: 'YYYY-MM-DD' }, if: 'this.data.user_type=="datetime"' }]
});
DataGridConfig.registerFieldType({
        value: 'textarea', label: '{#Long Text#}', typeForDB: 't',
        schema: [{ name: 'placeholder', label: 'Placeholder', type: 'text', if: 'this.data.user_type=="textarea"' }]
});

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
    const vs = globalThis.VirtualScroll({ itemHeight: 40 });
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
    return {
        init: () => { scrollEl = container.querySelector('.dt-main'); },
        reset: (list) => { state._listStartIndex = 0; vs.reset(list, scrollEl || container); if (state.list === list) vs.init(list, () => refresh(true)); },
        refresh, onScroll: () => refresh(false)
    };
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
    const copy = async () => {
        const bounds = getSelectionBounds(); if (!bounds) return;
        const text = state.list.slice(bounds.minRow, bounds.maxRow + 1).map(row => {
            return state.fields.slice(bounds.minCol, bounds.maxCol + 1).map(f => {
                let val = String(row[f.id] ?? '');
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
                    if (char === '"') { if (inQuotes && line[i+1] === '"') { current += '"'; i++; } else inQuotes = !inQuotes; }
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
                rowData.forEach((cellData, cOffset) => { const cIdx = startCol + cOffset; if (cIdx > maxCol || cIdx >= state.fields.length) return; const field = state.fields[cIdx]; rowItem[field.id] = cellData; rowChanged = true; });
                if (rowChanged) anyRowChanged = true;
            });
            if (anyRowChanged) state.list = [...state.list];
        } catch (err) { console.error('Paste Error:', err); }
    };
    return { applySelectionUI, clearAllActive, startSelect, updateSelect, endSelect, getSelectionBounds, copy, paste };
};

// Component Registration
globalThis.Component.register('DataGrid', container => {
        if (!container.state) container.state = globalThis.NewState({})
        const state = container.state
        container.editable = container.hasAttribute('editable')

        Object.assign(state, {
                list: [], fields: [], _renderedList: [],
                prevHeight: 0, postHeight: 0, _listStartIndex: 0,
                selectedRowCount: 0,
                _originalList: [],
                sortConfig: { fieldId: null, direction: null },
                filterConfig: {}, 
                activeFieldId: null, activeField: null, activeModes: [],
                _columnStats: {}, _internalUpdate: false, _appliedHash: '', _fieldsDirty: false, _masterCellNodes: null,
                isDirty: false, isBulkEdit: null,
                editable: container.editable
        })

        const perf = createPerfMonitor();
        state.perf = perf.stats;
        const selection = createSelectionManager(container, state);
        const scroll = createScrollManager(container, state, () => setTimeout(() => selection.applySelectionUI(), 50));

        const menuNode = container.querySelector('.dt-column-menu');
        if (menuNode) menuNode._thisObj = container;

        container.onColumnResizing = (field, e) => container.style.setProperty(`--w-${field.id}`, e.detail.newSize + 'px');
        container.onColumnResize = (field, e) => {
                const idx = state.fields.findIndex(f => f.id === field.id);
                if (idx !== -1) { state.fields[idx].width = e.detail.newSize; state.fields = [...state.fields]; }
        };

        let _editorOverlay, currentEditingNode = null;

        container.format = (val, field) => {
                if (field.formatter) return field.formatter(val, field);
                const typeInfo = DataGridConfig._fieldTypes.get(field.settings?.formType || field.type || 'text');
                if (typeInfo && typeInfo.formatter) return typeInfo.formatter(val, field);
                return val == null ? '' : (typeof val === 'object' ? JSON.stringify(val) : String(val));
        };

        container.onScroll = () => {
                perf.onScroll(); scroll.refresh();
                container.hideColumnMenu();
                container.hideEditor(true);
                const prev = container.querySelector('.dt-spacer-prev'), post = container.querySelector('.dt-spacer-post');
                if (prev) { prev.style.height = (state.prevHeight || 0) + 'px'; prev.style.display = state.prevHeight > 0 ? 'block' : 'none'; }
                if (post) { post.style.height = (state.postHeight || 0) + 'px'; post.style.display = state.postHeight > 0 ? 'block' : 'none'; }
        };

        container.applySortFilter = (options = {}) => {
                if (state._internalUpdate) return;
                const targetFilters = { ...state.filterConfig, ...(options.filters || {}) };
                const targetSort = options.sort !== undefined ? (options.sort ? { fieldId: state.activeFieldId, direction: options.sort } : { fieldId: null, direction: null }) : state.sortConfig;

                let filtered = [...state._originalList];
                Object.entries(targetFilters).forEach(([fId, cfg]) => {
                        if (!cfg.value && (!cfg.selectedValues || cfg.selectedValues.length === 0)) return;
                        filtered = filtered.filter(item => {
                                const val = item[fId];
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
                                if (a[fId] == b[fId]) return 0;
                                return a[fId] > b[fId] ? dir : -dir;
                        });
                }

                state._internalUpdate = true;
                state.filterConfig = targetFilters;
                state.sortConfig = targetSort;
                state.list = filtered;
                state._internalUpdate = false;
        };

        container.showColumnMenu = (field, event) => {
                const btn = event.currentTarget, menu = container.querySelector('.dt-column-menu');
                if (menu.style.display === 'block' && state.activeFieldId === field.id) {
                        container.hideColumnMenu();
                        container.applySortFilter();
                        return;
                }
                const type = field.settings?.formType || field.type || 'text';
                state.activeModes = MODE_MAP[type] || (['boolean', 'switch', 'checkbox', 'radio'].includes(type) ? [] : MODE_MAP.text);
                if (!state.filterConfig[field.id]) state.filterConfig[field.id] = { mode: state.activeModes[0] || 'contains', value: '', selectedValues: [] };
                state.activeField = field; state.activeFieldId = field.id;
                menu.style.display = 'block';
                const cellNode = btn.closest('.dt-cell'), rect = cellNode.getBoundingClientRect(), rootRect = container.getBoundingClientRect();
                const menuWidth = menu.offsetWidth || 260;
                let leftPos = rect.right - rootRect.left - menuWidth;
                if (leftPos < 0) leftPos = Math.max(0, rect.left - rootRect.left);
                menu.style.left = leftPos + 'px'; menu.style.top = (rect.bottom - rootRect.top + 5) + 'px';

                const onGlobalClick = (ev) => { if (menu.contains(ev.target) || btn.contains(ev.target)) return; container.hideColumnMenu(); container.applySortFilter(); document.removeEventListener('mousedown', onGlobalClick); };
                document.addEventListener('mousedown', onGlobalClick);
                setTimeout(() => menu.querySelector('input')?.focus(), 50);
        };

        container.toggleSelectedValue = (val) => {
                const filter = state.filterConfig[state.activeFieldId]; if (!filter) return;
                const idx = filter.selectedValues.indexOf(val); if (idx === -1) filter.selectedValues.push(val); else filter.selectedValues.splice(idx, 1);
                state.filterConfig = { ...state.filterConfig }; container.applySortFilter();
        };

        container.filterOnlyThis = (val) => { state.filterConfig[state.activeFieldId] = { mode: 'contains', value: '', selectedValues: [String(val)] }; state.filterConfig = { ...state.filterConfig }; container.applySortFilter(); };
        container.hideColumnMenu = () => { const menu = container.querySelector('.dt-column-menu'); if (menu) menu.style.display = 'none'; };
        container.setSort = (dir) => { const newDir = state.sortConfig.direction === dir && state.sortConfig.fieldId === state.activeFieldId ? null : dir; container.applySortFilter({ sort: newDir }); };
        container.clearColumnSettings = () => { if (!state.activeFieldId) return; state.filterConfig = { ...state.filterConfig, [state.activeFieldId]: { mode: state.activeModes[0] || 'contains', value: '', value2: '', selectedValues: [] } }; container.applySortFilter(); };

        container._initRow = (rowNode) => {
                const row = rowNode._ref?.item;
                if (row && row._editingF === undefined) { Object.defineProperty(row, '_editingF', { set: (v) => { if (v === null) container.hideEditor(true); }, configurable: true }); }
                Array.from(rowNode.children).forEach(cell => { const fIdx = parseInt(cell.dataset.fidx); if (!isNaN(fIdx)) cell._ref = { ...(cell._ref || rowNode._ref), f: state.fields[fIdx], fIdx: fIdx }; });
        };

        state.__watch('fields', fields => {
                if (!fields) return;
                state._fieldsDirty = true; state._masterCellNodes = null;
                container.style.setProperty('--dt-grid-template', fields.map(f => `var(--w-${f.id}, ${(f.settings?.width || f.width) || 150}px)`).join(' '));
                container.style.setProperty('--dt-row-width', fields.reduce((sum, f) => sum + ((f.settings?.width || f.width) || 150), 0) + 'px');

                let leftSum = 0;
                fields.forEach(f => {
                        const pinned = f.settings?.pinned || f.pinned;
                        if (pinned === 'left') { container.style.setProperty(`--l-${f.id}`, leftSum + 'px'); leftSum += ((f.settings?.width || f.width) || 150); }
                });
                let rightSum = 0;
                [...fields].reverse().forEach(f => {
                        const pinned = f.settings?.pinned || f.pinned;
                        if (pinned === 'right') { container.style.setProperty(`--r-${f.id}`, rightSum + 'px'); rightSum += ((f.settings?.width || f.width) || 150); }
                });

        });

        state.__watch('list', list => {
                if (!state._internalUpdate) {
                        state._originalList = [...(list || [])];
                        setTimeout(() => {
                                const stats = {};
                                state.fields.forEach(f => {
                                        const counts = {};
                                        state._originalList.forEach(item => { const val = item[f.id], key = (val == null || val === '') ? '' : String(val); counts[key] = (counts[key] || 0) + 1; });
                                        stats[f.id] = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([val, count]) => ({ val, count }));
                                });
                                state._columnStats = stats;
                        }, 200);
                }
                scroll.init(); scroll.reset(list);
        });

        container.editCell = (row, field, cellNode) => {
                const main = container.querySelector('.dt-main');
                const overlay = container.querySelector('.dt-editor-overlay'), rect = cellNode.getBoundingClientRect(), mainRect = main.getBoundingClientRect();
                currentEditingNode = cellNode;
                const formType = field.settings?.formType || field.type || 'text';
                const form = overlay.querySelector('AutoForm');
                if (form) {
                        form.state.data = globalThis.NewState(globalThis.Util.clone(row));
                        form.state.schema = [{ ...field, type: formType, options: field.settings?.options || field.options, name: field.id, label: '' }];
                }
                const isComplex = ['textarea', 'TagsInput', 'checkbox', 'radio'].includes(formType);
                let topPos = rect.top - mainRect.top + main.scrollTop - 1;
                let leftPos = rect.left - mainRect.left + main.scrollLeft - 1;
                let editorWidth = Math.max(rect.width + 2, isComplex ? 300 : 0);
                
                const maxLeft = main.scrollWidth - editorWidth - 5;
                if (leftPos > maxLeft) leftPos = Math.max(0, maxLeft);
                
                Object.assign(overlay.style, {
                        display: 'flex', 
                        left: leftPos + 'px', 
                        top: topPos + 'px',
                        width: editorWidth + 'px',
                        height: 'auto',
                        minHeight: (rect.height + 2) + 'px',
                        maxHeight: Math.max(100, mainRect.height - (rect.top - mainRect.top) - 5) + 'px',
                        overflow: 'auto',
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

                        let hasChanges = false;
                        const schema = form.state.schema || [];
                        schema.forEach(field => {
                                const row = currentEditingNode?.closest('.dt-row')?._ref?.item;
                                if (row && JSON.stringify(row[field.name]) !== JSON.stringify(form.data[field.name])) {
                                        row[field.name] = form.data[field.name];
                                        hasChanges = true;
                                }
                        });

                        if (state.isBulkEdit) {
                                const { minRow, maxRow, fIdx } = state.isBulkEdit;
                                const field = state.fields[fIdx]; const newValue = form.data[field.id];
                                for (let i = minRow; i <= maxRow; i++) {
                                        if (state.list[i] && state.list[i][field.id] !== newValue) {
                                                state.list[i][field.id] = newValue;
                                                hasChanges = true;
                                        }
                                }
                        }
                        if (hasChanges) {
                                state.list = [...state.list];
                                state.isDirty = true;
                        }
                }
                _editorOverlay.style.display = 'none';
                if (form) { form.state.schema = []; form.data = null; }
                currentEditingNode = null; state.isBulkEdit = null; container.focus();
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

        container.onMainDblClick = e => {
                if (!container.editable) return;
                const cell = e.target.closest('.dt-cell'), row = cell?.closest('.dt-row');
                if (row && !row.classList.contains('dt-header-row')) {
                        const item = row._ref?.item, fIdx = cell.dataset.fidx ? parseInt(cell.dataset.fidx) : Array.from(row.querySelectorAll('.dt-cell')).indexOf(cell);
                        const rIdx = row._ref?.rIdx ?? Array.from(container.querySelectorAll('.dt-body-row')).indexOf(row);
                        const absoluteRow = rIdx + state._listStartIndex;

                        if (item && state.fields[fIdx]) {
                                const bounds = selection.getSelectionBounds();
                                if (bounds && absoluteRow >= bounds.minRow && absoluteRow <= bounds.maxRow && fIdx >= bounds.minCol && fIdx <= bounds.maxCol) {
                                        const affectedRows = bounds.maxRow - bounds.minRow + 1;
                                        if (affectedRows > 1) {
                                                state.isBulkEdit = { ...bounds, fIdx };
                                                if (globalThis.UI?.toast) globalThis.UI.toast(`Bulk Edit: Updating ${affectedRows} rows in column "${state.fields[fIdx].name}"`, { type: 'warning' });
                                        }
                                }
                                container.editCell(item, state.fields[fIdx], cell);
                        }
                }
        };

        container.addRow = () => {
                const newRow = {}; state.fields.forEach(f => newRow[f.id] = '');
                state._originalList.push(newRow); state.list = [...state._originalList]; state.isDirty = true;
                setTimeout(() => { scroll.reset(state.list); container.querySelector('.dt-main').scrollTop = container.querySelector('.dt-main').scrollHeight; }, 50);
        };

        container.deleteSelectedRow = async () => {
                const bounds = selection.getSelectionBounds(); if (!bounds) return;
                const count = bounds.maxRow - bounds.minRow + 1;
                if (await globalThis.Dialog.confirm(`Are you sure you want to delete ${count} row(s)?`)) {
                        const rMin = bounds.minRow, rMax = bounds.maxRow;
                        const removedItems = state.list.slice(rMin, rMax + 1);
                        state.list = state.list.filter((_, i) => !(i >= rMin && i <= rMax));
                        state._originalList = state._originalList.filter(item => !removedItems.includes(item));
                        state.isDirty = true; selection.clearAllActive();
                        container.dispatchEvent(new CustomEvent('remove', { detail: { items: removedItems } }));
                }
        };

        container.saveChanges = () => { container.dispatchEvent(new CustomEvent('save', { detail: { list: state._originalList, fields: state.fields } })); state.isDirty = false; };

        const getFieldSchema = () => {
                const types = globalThis.DataGrid.getFieldTypes();
                const baseSchema = [
                        { name: 'id', label: 'Field ID', type: 'text', setting: { required: true, placeholder: 'e.g. user_name' } },
                        { name: 'name', label: 'Display Name', type: 'text', setting: { required: true, placeholder: 'e.g. 用户名' } },
                        { name: 'user_type', label: 'Field Type', type: 'select', options: types.map(t => ({ label: t.label, value: t.value })) }
                ];
                const dynamicSchema = types.reduce((acc, t) => acc.concat(t.schema || []), []);
                return baseSchema.concat(dynamicSchema, [{ name: 'isIndex', label: 'Index', type: 'switch' }, { name: 'memo', label: 'Memo', type: 'text' }]);
        };

        const parseOptionsStr = (str) => {
                if (!str) return undefined;
                return str.split('\n').map(s => s.trim()).filter(Boolean).map(line => {
                        const idx = line.indexOf(':'); if (idx > -1) return { label: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() }; return line;
                });
        };
        const formatOptionsStr = (opts) => { if (!opts) return ''; return opts.map(o => typeof o === 'object' ? `${o.label}:${o.value}` : o).join('\n'); };

        container.addField = async () => {
                container.hideColumnMenu();
                const data = globalThis.NewState({ id: 'c' + Date.now().toString().slice(-4), name: 'New Field', user_type: 'text', decimals: 0, isIndex: false, memo: '', options_str: '' });
                const d = container.querySelector(`Modal[id="${container.id}_field_modal"]`);
                if (!d) return;
                Object.assign(d.state, { title: 'Add Field', buttons: ['Cancel', 'Save'] });
                const form = d.querySelector('AutoForm');
                if (form) {
                        form.state.data = data; form.state.schema = getFieldSchema();
                }
                d.show();
                const result = await new Promise(resolve => d.addEventListener('change', e => resolve(d.result), { once: true }));
                if (result === 2) {
                        const typeInfo = globalThis.DataGrid.getFieldTypes().find(t => t.value === data.user_type);
                        let dbType = typeInfo?.typeForDB || 'v1024'; if (data.user_type === 'number') dbType = data.decimals > 0 ? 'ff' : 'bi';
                        const field = { id: data.id, name: data.name, memo: data.memo, isIndex: !!data.isIndex, type: dbType, settings: { formType: data.user_type, decimals: data.decimals, prefix: data.prefix, suffix: data.suffix, thousandSep: data.thousandSep, labelOn: data.labelOn, labelOff: data.labelOff, format: data.format, placeholder: data.placeholder, options: parseOptionsStr(data.options_str) } };
                        state.fields = [...state.fields, field]; state.isDirty = true; container.dispatchEvent(new CustomEvent('savefields', { detail: state.fields })); state.list = [...state.list];
                }
        };

        container.editField = async () => {
                if (!state.activeField) return;
                container.hideColumnMenu();
                const f = state.activeField; const s = f.settings || {};
                const data = globalThis.NewState({ id: f.id, name: f.name, memo: f.memo || '', isIndex: !!f.isIndex, user_type: s.formType || 'text', decimals: s.decimals || 0, prefix: s.prefix || '', suffix: s.suffix || '', thousandSep: !!s.thousandSep, labelOn: s.labelOn || '', labelOff: s.labelOff || '', format: s.format || '', placeholder: s.placeholder || '', options_str: formatOptionsStr(s.options) });
                const d = container.querySelector(`Modal[id="${container.id}_field_modal"]`);
                if (!d) return;
                Object.assign(d.state, { title: 'Edit Field', buttons: ['Cancel', 'Save'] });
                const form = d.querySelector('AutoForm');
                if (form) {
                        form.state.data = data; form.state.schema = getFieldSchema();
                }
                d.show();
                const result = await new Promise(resolve => d.addEventListener('change', e => resolve(d.result), { once: true }));
                if (result === 2) {
                        const idx = state.fields.findIndex(item => item.id === f.id);
                        if (idx !== -1) {
                                const typeInfo = globalThis.DataGrid.getFieldTypes().find(t => t.value === data.user_type);
                                let dbType = typeInfo?.typeForDB || 'v1024'; if (data.user_type === 'number') dbType = data.decimals > 0 ? 'ff' : 'bi';
                                const updatedField = { ...f, id: data.id, name: data.name, memo: data.memo, isIndex: !!data.isIndex, type: dbType, settings: { ...f.settings, formType: data.user_type, decimals: data.decimals, prefix: data.prefix, suffix: data.suffix, thousandSep: data.thousandSep, labelOn: data.labelOn, labelOff: data.labelOff, format: data.format, placeholder: data.placeholder, options: parseOptionsStr(data.options_str) } };
                                state.fields[idx] = updatedField; state.fields = [...state.fields]; state.isDirty = true; container.dispatchEvent(new CustomEvent('savefields', { detail: state.fields })); state.list = [...state.list];
                        }
                }
        };

        container.deleteField = async () => {
                if (!state.activeField) return;
                container.hideColumnMenu();
                if (await globalThis.Dialog.confirm(`Are you sure you want to delete field "${state.activeField.name}"?`)) {
                        const idx = state.fields.findIndex(f => f.id === state.activeField.id);
                        if (idx !== -1) { state.fields.splice(idx, 1); state.fields = [...state.fields]; state.isDirty = true; container.dispatchEvent(new CustomEvent('savefields', { detail: state.fields })); state.list = [...state.list]; }
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
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
                        e.preventDefault();
                        selection.paste();
                }
        });

        state._MODE_ICONS = MODE_ICONS;
}, globalThis.Util.makeDom(/*html*/`
<div class="dt-root d-flex flex-column h-100 border bg-body text-body overflow-visible" style="position:relative; user-select:none; outline: none; min-height: 0" tabindex="0">
        <div class="dt-main flex-grow-1 overflow-auto" $onscroll="this.onScroll()" 
                $onmousedown="this.onMainMouseDown(event)" $onmouseover="this.onMainMouseOver(event)" $ondblclick="this.onMainDblClick(event)"
                style="overflow-anchor:none; min-height: 0">
                <div class="dt-header border-bottom bg-light sticky-top" style="z-index:20">
                        <div class="dt-header-row fw-bold text-muted small">
                                <template $each="this.state?.fields || []">
                                        <div $data-id="item.id" $class="dt-cell dt-col border-end d-flex align-items-center header-cell \${(item.settings?.pinned || item.pinned) ? 'pinned-' + (item.settings?.pinned || item.pinned) : ''}" $style="((item.settings?.pinned || item.pinned) ? 'position: sticky; z-index: 11; background-color: inherit; ' : 'position:relative; ') + 'padding: 0; ' + ((item.settings?.pinned || item.pinned) === 'left' ? 'left: var(--l-' + item.id + '); border-right: 1px solid var(--bs-border-color); box-shadow: 2px 0 5px -2px rgba(0,0,0,0.1);' : ((item.settings?.pinned || item.pinned) === 'right' ? 'right: var(--r-' + item.id + '); border-left: 1px solid var(--bs-border-color); box-shadow: -2px 0 5px -2px rgba(0,0,0,0.1);' : ''))">
                                                <div class="d-flex align-items-center overflow-hidden flex-grow-1 h-100 px-2 cursor-pointer" $onclick="this.showColumnMenu(item, event)">
                                                        <i $if="this.state?.filterConfig?.[item.id] && (this.state.filterConfig[item.id].value || this.state.filterConfig[item.id].selectedValues?.length)" class="bi bi-filter me-1 text-primary"></i>
                                                        <i $if="this.state?.sortConfig?.fieldId === item.id && this.state.sortConfig.direction" $class="bi bi-sort-\${this.state.sortConfig.direction === 'asc' ? 'down' : 'up-alt'} me-1 text-primary"></i>
                                                        <span $text="item.name" class="text-truncate flex-grow-1"></span>
                                                </div>
                                                <button class="btn btn-xs btn-link text-muted p-0 border-0 me-1 header-menu-btn" $onclick="this.showColumnMenu(item, event)"><i class="bi bi-chevron-down"></i></button>
                                                <Resizer $.target="thisNode.parentElement" style="position:absolute; right:0; top:0; bottom:0; width:4px; z-index:10" min="50" max="1000" $onresizing="this.onColumnResizing(item, event)" $onresize="this.onColumnResize(item, event)"></Resizer>
                                        </div>
                                </template>
                        </div>
                </div>
                <div class="dt-body" style="position:relative">
                        <div class="dt-spacer-prev flex-shrink-0" style="display:none"></div>
                        <template $each="this.state?._renderedList || []" key="id" index="rIdx">
                                <div class="dt-row dt-body-row border-bottom bg-white" $.="this._initRow(thisNode)">
                                        <template $each="this.state?.fields || []" as="f" index="fIdx" key="id"><div $data-fidx="fIdx" $class="dt-cell border-end px-2 d-flex align-items-center \${(f.settings?.pinned || f.pinned) ? 'pinned-' + (f.settings?.pinned || f.pinned) : ''}" $style="((f.settings?.pinned || f.pinned) ? 'position: sticky; z-index: 1; background-color: inherit; ' : '') + ((f.settings?.pinned || f.pinned) === 'left' ? 'left: var(--l-' + f.id + '); border-right: 1px solid var(--bs-border-color); box-shadow: 2px 0 5px -2px rgba(0,0,0,0.1);' : ((f.settings?.pinned || f.pinned) === 'right' ? 'right: var(--r-' + f.id + '); border-left: 1px solid var(--bs-border-color); box-shadow: -2px 0 5px -2px rgba(0,0,0,0.1);' : ''))"><span $text="this.format(item[f.id], f)" class="text-truncate"></span></div></template>
                                </div>
                        </template>
                        <div class="dt-spacer-post flex-shrink-0" style="display:none"></div>
                </div>
                <div class="dt-editor-overlay dt-editor-container" style="display: none; position: absolute; z-index: 1000; background: var(--bs-body-bg); box-shadow: 0 4px 16px rgba(0,0,0,0.25); border: 1px solid var(--bs-primary); padding: 0;"><AutoForm nobutton inline class="h-100 w-100" $onsubmit="event.preventDefault(); thisNode.closest('DataGrid').hideEditor(true)"></AutoForm></div>
        </div>

        <div class="dt-column-menu bg-body shadow-lg rounded p-2" style="display:none; position:absolute; z-index:2000; min-width:240px; max-width:300px; border: 1px solid var(--bs-primary)">
                <template $if="this.state?.activeFieldId">
                        <div class="d-flex gap-1 mb-2">
                                <button $class="btn btn-xs flex-grow-1 d-flex align-items-center justify-content-center \${this.state?.sortConfig?.direction === 'asc' && this.state?.sortConfig?.fieldId === this.state?.activeFieldId ? 'btn-primary' : 'btn-outline-secondary border'}" $onclick="this.setSort('asc')"><i class="bi bi-sort-alpha-down me-1"></i> ASC</button>
                                <button $class="btn btn-xs flex-grow-1 d-flex align-items-center justify-content-center \${this.state?.sortConfig?.direction === 'desc' && this.state?.sortConfig?.fieldId === this.state?.activeFieldId ? 'btn-primary' : 'btn-outline-secondary border'}" $onclick="this.setSort('desc')"><i class="bi bi-sort-alpha-up-alt me-1"></i> DESC</button>
                        </div>

                        <template $if="this.state?.activeModes?.length">
                        <div class="py-2 border-bottom" style="min-height: 48px">
                                <div class="input-group input-group-sm mb-1">
                                        <input type="text" class="form-control" $placeholder="(this.state?.filterConfig?.[this.state?.activeFieldId]?.mode || 'Search').toUpperCase() + '...'" $bind="this.state.filterConfig[this.state.activeFieldId].value" $oninput="this.applySortFilter()" $onkeydown="if(event.key==='Enter'){this.applySortFilter();this.hideColumnMenu();}">
                                        <button class="btn btn-outline-secondary border dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" title="Search Mode">
                                                <i $class="bi \${this.state?._MODE_ICONS?.[this.state?.filterConfig?.[this.state?.activeFieldId]?.mode] || 'bi-filter'}"></i>
                                        </button>
                                        <ul class="dropdown-menu dropdown-menu-end shadow">
                                                <template $each="this.state?.activeModes || []" as="m">
                                                        <li><button class="dropdown-item d-flex align-items-center" type="button" $onclick="this.state.filterConfig[this.state.activeFieldId].mode = m; this.state.filterConfig = {...this.state.filterConfig}">
                                                                <i $class="bi \${this.state?._MODE_ICONS?.[m] || 'bi-filter'} me-2"></i> <span $text="m.toUpperCase()"></span>
                                                        </button></li>
                                                </template>
                                        </ul>
                                </div>
                                <input $if="this.state?.filterConfig?.[this.state?.activeFieldId]?.mode === 'between'" type="text" class="form-control form-control-sm" placeholder="And..." $bind="this.state.filterConfig[this.state.activeFieldId].value2" $oninput="this.applySortFilter()" $onkeydown="if(event.key==='Enter'){this.applySortFilter();this.hideColumnMenu();}">
                        </div>
                        </template>

                        <div class="mt-2" style="max-height: 180px; overflow-y: auto;">
                                <template $each="this.state?._columnStats?.[this.state?.activeFieldId] || []">
                                        <label class="d-flex align-items-center mb-1 small cursor-pointer p-1 rounded-1 menu-item-row" onmouseover="this.style.background='var(--bs-light)'" onmouseout="this.style.background='transparent'">
                                                <input type="checkbox" class="form-check-input me-2" $checked="this.state?.filterConfig?.[this.state?.activeFieldId]?.selectedValues?.includes(String(item.val))" $onclick="this.toggleSelectedValue(String(item.val))">
                                                <span class="text-truncate flex-grow-1"><span $text="item.val || '(Empty)'"></span> <span class="text-muted ms-1" style="font-size: 0.7rem" $text="'(' + item.count + ')'"></span></span>
                                                <button class="btn btn-xs btn-link p-0 text-primary only-btn" style="font-size: 10px; text-decoration: none" $onclick="this.filterOnlyThis(item.val); event.preventDefault(); event.stopPropagation();">Only</button>
                                        </label>
                                </template>
                        </div>

                        <div $if="this.state?.filterConfig?.[this.state?.activeFieldId]?.value || this.state?.filterConfig?.[this.state?.activeFieldId]?.selectedValues?.length" class="mt-2 pt-1 border-top text-center">
                                <span class="cursor-pointer text-primary small fw-bold" $onclick="this.clearColumnSettings()"><i class="bi bi-x-circle me-1"></i> Clear Filter</span>
                        </div>

                        <div $if="this.state?.editable" class="mt-3 pt-2 border-top d-flex gap-1 justify-content-between">
                                <button class="btn btn-sm btn-light border-0 flex-grow-1" title="Edit Field" $onclick="this.editField()"><i class="bi bi-pencil"></i></button>
                                <button class="btn btn-sm btn-light border-0 flex-grow-1" title="Add Field" $onclick="this.addField()"><i class="bi bi-plus-lg"></i></button>
                                <button class="btn btn-sm btn-light border-0 flex-grow-1 text-danger" title="Delete Field" $onclick="this.deleteField()"><i class="bi bi-trash"></i></button>
                        </div>
                </template>
        </div>

        <Modal $.id="this.id + '_field_modal'">
            <div slot="body"><AutoForm nobutton class="p-3"></AutoForm></div>
            <div slot="footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" $onclick="thisNode.closest('Modal').result=1">Cancel</button>
                <button type="button" class="btn btn-primary" data-bs-dismiss="modal" $onclick="thisNode.closest('Modal').result=2">Save</button>
            </div>
        </Modal>

        <div class="dt-footer border-top bg-light d-flex align-items-center px-3 py-1 shadow-sm" style="height:40px; z-index: 10">
                <div class="d-flex align-items-center gap-3 flex-grow-1">
                        <div $if="this.state?.editable" class="d-flex align-items-center gap-1">
                                <button class="btn btn-sm btn-light border-0 d-flex align-items-center px-2 py-1" $onclick="this.addRow()" title="Add Row"><i class="bi bi-plus-lg text-primary me-1"></i> Add</button>
                                <button class="btn btn-sm btn-light border-0 d-flex align-items-center px-2 py-1" $onclick="this.deleteSelectedRow()" $disabled="!this.state?.selectedRowCount" title="Delete Selected Rows"><i class="bi bi-trash text-danger me-1"></i> Delete</button>
                        </div>
                        <div $if="this.state?.editable" class="vr h-50 my-auto text-muted opacity-25"></div>
                        <div class="d-flex align-items-center gap-2 text-muted" style="font-size: 0.75rem">
                                <i class="bi bi-check-all fs-6"></i>
                                <span $text="(this.state?.selectedRowCount || 0) + ' selected / ' + (this.state?.list?.length || 0) + ' total'"></span>
                        </div>
                </div>
                <div $if="this.state?.editable" class="d-flex align-items-center gap-2">
                        <button $if="this.state?.isDirty" class="btn btn-sm btn-primary border-0 px-3 shadow-sm d-flex align-items-center fw-bold" $onclick="this.saveChanges()"><i class="bi bi-cloud-upload me-1"></i> Save</button>
                        <button $if="!this.state?.isDirty" class="btn btn-sm btn-light border-0 px-3 text-muted disabled d-flex align-items-center" disabled><i class="bi bi-cloud-check me-1"></i> Saved</button>
                </div>
        </div>
</div>
`), globalThis.Util.makeDom(/*html*/`
<style>
        DataGrid { display: block; }
        .dt-root { font-size: 0.875rem; }
        .dt-row, .dt-header-row { display: grid; grid-template-columns: var(--dt-grid-template); width: var(--dt-row-width, max-content); min-width: 100%; height: 40px; contain: paint layout; }
        .dt-main { position: relative; }
        .dt-header-row { background-color: var(--bs-tertiary-bg); border-bottom: 1px solid var(--bs-border-color); }
        .dt-cell { background: inherit; white-space: nowrap; flex-shrink: 0; contain: content; }
        .dt-cell-selected { background-color: rgba(var(--bs-primary-rgb), 0.15) !important; outline: 1px solid var(--bs-primary); outline-offset: -1px; }
        .dt-body-row:hover { background-color: var(--bs-secondary-bg) !important; }
        .header-cell .header-menu-btn { opacity: 0; transition: opacity 0.2s; }
        .header-cell:hover .header-menu-btn { opacity: 1; }
        .dt-column-menu { background-color: var(--bs-body-bg); border: 1px solid var(--bs-primary); box-shadow: 0 10px 40px rgba(0,0,0,0.2) !important; z-index: 2100 !important; }
        .btn-xs { padding: 1px 5px; line-height: 1.5; }
        .cursor-pointer { cursor: pointer; }
        .dt-filter-tabs i { font-size: 1.1rem; }
        .dt-filter-tabs div:hover i { color: var(--bs-primary); }
        .menu-item-row .only-btn { opacity: 0; }
        .menu-item-row:hover .only-btn { opacity: 1; }
        .dt-editor-overlay .auto-form-root form { gap: 0 !important; margin: 0 !important; height: 100%; }
        .dt-editor-overlay [control-wrapper] { width: 100%; margin: 0 !important; min-height: 100% !important; align-items: stretch !important; }
        .dt-editor-overlay [control-wrapper] > .d-flex { padding: 0.375rem 0.5rem; justify-content: flex-start !important; align-items: center !important; }
        .dt-editor-overlay [control-wrapper] > .form-switch { padding-left: 2.5rem !important; }
        .dt-editor-overlay [control-wrapper] > textarea { min-height: 100px; resize: vertical; }
</style>
`))

globalThis.DataGrid = DataGridConfig;
