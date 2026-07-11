/**
 * VirtualScroll Utility Module
 */
const VirtualScroll = (options = {}) => {
        const itemHeights = new Map()
        const groupHeights = new Map()
        let groupItemCount = 1
        const avg = globalThis.Util.newAvg()
        let padTop = 0, rowGap = 0, topMargin = 0, itemMarginTop = null, itemMarginBottom = null, listInited = false

        const providedItemHeight = options.itemHeight || null;

        return {
                reset: (list, container) => {
                        listInited = false; itemHeights.clear(); groupHeights.clear(); avg.clear(); topMargin = 0; itemMarginTop = null; itemMarginBottom = null;
                        if (!list?.length) return [];
                        const size = list.length; groupItemCount = Math.ceil(Math.sqrt(size)) || 10;
                        const style = window.getComputedStyle(container);
                        padTop = parseFloat(style.paddingTop) || 0; rowGap = parseFloat(style.rowGap) || 0;
                        const visibleCount = Math.max(10, Math.ceil((container.clientHeight || 100) / (providedItemHeight || 32)));
                        return list.slice(0, Math.min(visibleCount * 3, size));
                },
                init: (list, refreshCallback) => {
                        if (listInited) return;
                        const size = list.length;
                        let defaultHeight = providedItemHeight || avg.get() || 32;
                        if (size > 0 && typeof list[0] === 'object' && list[0] !== null && list[0]._itemHeight) {
                                defaultHeight = list[0]._itemHeight;
                        }
                        avg.add(defaultHeight);
                        if (itemMarginTop === null) { itemMarginTop = 0; itemMarginBottom = 0; }
                        for (let i = 0; i < size; i++) {
                                if (!itemHeights.has(i)) {
                                        const ih = (typeof list[i] === 'object' && list[i] !== null && list[i]._itemHeight) ? list[i]._itemHeight : defaultHeight;
                                        itemHeights.set(i, ih);
                                }
                        }
                        for (let i = 0; i < size; i += groupItemCount) groupHeights.set(i, Math.min(groupItemCount, size - i) * defaultHeight);
                        listInited = true; refreshCallback();
                },
                update: (absoluteIndex, node) => {
                        if (node.offsetHeight === 0) return;
                        if (itemMarginTop === null) {
                                const style = window.getComputedStyle(node);
                                itemMarginTop = parseFloat(style.marginTop) || 0; itemMarginBottom = parseFloat(style.marginBottom) || 0;
                        }
                        if (absoluteIndex === 0 && !topMargin) topMargin = itemMarginTop;
                        const newHeight = node.offsetHeight + itemMarginTop + itemMarginBottom + rowGap;
                        const oldHeight = itemHeights.get(absoluteIndex);
                        if (newHeight !== oldHeight) {
                                itemHeights.set(absoluteIndex, newHeight); avg.add(newHeight);
                                const offset = newHeight - (oldHeight || 0), groupIndex = absoluteIndex - (absoluteIndex % groupItemCount);
                                if (groupHeights.has(groupIndex)) groupHeights.set(groupIndex, groupHeights.get(groupIndex) + offset);
                        }
                },
                calc: (container, list) => {
                        if (!listInited || !list) return null;
                        const size = list.length;
                        const avgVal = Math.max(16, avg.get() || 32);
                        let visibleCount = Math.max(10, Math.ceil((container.clientHeight || 100) / avgVal));
                        let prev = padTop + topMargin + rowGap, post = 0, status = 0, listStartIndex = 0, listEndIndex = 0;
                        let renderedList = [];
                        const scrollTop = container.scrollTop;
                        let loopCount = 0;

                        for (let i = 0; i < size; i++) {
                                if (++loopCount > size * 2) throw new Error('VirtualScroll infinite loop');
                                if (status === 0) {
                                        const gh = groupHeights.get(i);
                                        if (gh && prev + gh <= scrollTop && (i + groupItemCount < size)) {
                                                prev += gh; i += groupItemCount - 1;
                                        } else {
                                                const ih = itemHeights.get(i);
                                                if (prev + ih <= scrollTop && i < size - 1) {
                                                        prev += ih;
                                                } else {
                                                        status = 1;
                                                        let visibleStartIndex = Math.max(0, i);
                                                        listStartIndex = Math.max(0, visibleStartIndex - visibleCount);
                                                        listEndIndex = Math.min(listStartIndex + visibleCount * 3, size);
                                                        i = listEndIndex - 1;
                                                        renderedList = list.slice(listStartIndex, listEndIndex);
                                                        for (let j = listStartIndex; j < visibleStartIndex; j++) prev -= itemHeights.get(j);
                                                }
                                        }
                                } else if (status === 1) {
                                        const gh = groupHeights.get(i);
                                        if (gh) { post += gh; i += groupItemCount - 1; }
                                        else post += itemHeights.get(i);
                                }
                        }
                        const finalPrevHeight = Math.max(0, prev - padTop - topMargin - rowGap - (listStartIndex > 0 ? rowGap : 0));
                        const finalPostHeight = post > 0 ? Math.max(0, post - 2 * rowGap) : 0;
                        return { prevHeight: finalPrevHeight, postHeight: finalPostHeight, renderedList, listStartIndex };
                }
        }
}

globalThis.VirtualScroll = VirtualScroll;
