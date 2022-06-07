(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.TinyMDE = factory());
})(this, (function () { 'use strict';

    function noop() { }

    function addEvent(el, name, handler) {
        el.addEventListener(name, handler);
        return function () {
            el.removeEventListener(name, handler);
        }
    }

    function debounce(func, timeout = 250) {
        let timeId;
        return function (...args) {
            window.clearTimeout(timeId);
            timeId = window.setTimeout(() => {
                func.apply(this, args);
            }, timeout);
        }
    }

    const repeat = String.prototype.repeat
        ?
        function (str, count) {
            return str.repeat(count)
        }
        : function (str, count) {
            let s = '';
            for (let i = 0; i < count; i++) {
                s += str;
            }
            return s
        };

    function padNewLines(state, count = 2) {
        const { selectionStart, selectionEnd, value } = state;
        let before = count;
        let beforeEdge = false;
        for (let i = 1; i <= count; i++) {
            const startIndex = selectionStart - i;
            if (startIndex < 0) {
                before = 0;
                beforeEdge = true;
                break
            }
            if (value[startIndex] === '\n') {
                before -= 1;
            }
            else {
                break
            }
        }
        const { length } = value;
        let after = count;
        let afterEdge = false;
        for (let i = 0; i < count; i++) {
            const endIndex = selectionEnd + i;
            if (endIndex >= length) {
                after = 0;
                afterEdge = true;
                break
            }
            if (value[endIndex] === '\n') {
                after -= 1;
            }
            else {
                break
            }
        }
        return {
            before: repeat('\n', before),
            beforeEdge,
            after: repeat('\n', after),
            afterEdge
        }
    }

    const hasOwn = Object.prototype.hasOwnProperty;
    const assign = Object.assign ||
        function (target, ...args) {
            if (target == null) {
                throw new TypeError('Cannot convert undefined or null to object')
            }
            const to = Object(target);
            args.forEach(arg => {
                if (arg == null)
                    return
                for (let key in arg) {
                    if (hasOwn.call(arg, key)) {
                        to[key] = arg[key];
                    }
                }
            });
            return to
        };

    function copy(state) {
        return {
            selectionStart: state.selectionStart,
            selectionEnd: state.selectionEnd,
            value: state.value
        }
    }
    function merge(target, newState) {
        target.value = newState.value;
        target.selectionStart = newState.selectionStart;
        target.selectionEnd = newState.selectionEnd;
    }
    function isEqual(a, b) {
        if (!a || !b)
            return false
        return (a.value === b.value &&
            a.selectionStart === b.selectionStart &&
            a.selectionEnd === b.selectionEnd)
    }

    class StateHistory {
        constructor(state, max) {
            this.state = state;
            this.max = max;
            this.clear();
            this.push();
        }
        push() {
            const { history, current, state } = this;
            if (isEqual(history[current], state))
                return
            const copyState = copy(state);
            history.splice(current + 1, history.length - current, copyState);
            if (history.length > this.max) {
                history.shift();
            }
            else {
                this.current += 1;
            }
        }
        go(count) {
            const newIndex = this.current + count;
            if (newIndex >= 0 && newIndex < this.history.length) {
                this.current = newIndex;
                merge(this.state, this.history[newIndex]);
            }
        }
        clear() {
            this.history = [];
            this.current = -1;
        }
    }

    function stringSplice(str, start, end, insert = '') {
        const startString = str.slice(0, start);
        const endString = str.slice(end);
        return startString + insert + endString
    }

    function getInOut(inOut) {
        if (typeof inOut === 'string') {
            return {
                intro: inOut,
                outro: inOut
            }
        }
        return inOut
    }
    function wrap(state, introOutro) {
        const { intro, outro } = getInOut(introOutro);
        const { selectionStart, selectionEnd, value } = state;
        state.value = stringSplice(value, selectionStart, selectionEnd, intro + value.slice(selectionStart, selectionEnd) + outro);
        const selectionOffset = intro.length;
        state.selectionStart = selectionStart + selectionOffset;
        state.selectionEnd = selectionEnd + selectionOffset;
        return state
    }

    const brReg = /\n{1}/g;
    function list(state, pattern) {
        let symbolFunc;
        if (typeof pattern === 'string') {
            symbolFunc = () => pattern;
        }
        else {
            symbolFunc = pattern;
        }
        const { before, after } = padNewLines(state);
        const { selectionStart, selectionEnd, value } = state;
        const selectedString = value.slice(selectionStart, selectionEnd);
        let index = 0;
        const firstSymbol = symbolFunc(index);
        let newString = selectedString.replace(brReg, match => {
            index += 1;
            return match + symbolFunc(index)
        });
        newString = before + firstSymbol + newString + after;
        state.value = stringSplice(value, selectionStart, selectionEnd, newString);
        if (selectedString) {
            state.selectionStart =
                selectionStart + before.length + (index ? 0 : firstSymbol.length);
            state.selectionEnd = selectionStart + newString.length - after.length;
        }
        else {
            state.selectionStart = state.selectionEnd =
                selectionStart + before.length + firstSymbol.length;
        }
        return state
    }

    const defaultURL = 'url';
    const defaultURLLength = defaultURL.length;
    function linkOrImage(state, url = '', text = '', isLink) {
        const { selectionStart, selectionEnd, value } = state;
        const selectedText = value.slice(selectionStart, selectionEnd);
        if (!text) {
            text = selectedText;
        }
        let noUrl;
        if (!url) {
            noUrl = true;
            url = defaultURL;
        }
        let intro = (isLink ? '' : '!') + '[';
        const outroIn = '](';
        const outroOut = ')';
        const newString = intro + text + outroIn + url + outroOut;
        state.value = stringSplice(value, selectionStart, selectionEnd, newString);
        if (!noUrl && text) {
            state.selectionEnd = state.selectionStart =
                selectionStart + newString.length;
        }
        else if (!text) {
            state.selectionStart = state.selectionEnd = selectionStart + intro.length;
        }
        else {
            const start = selectionStart + intro.length + text.length + outroIn.length;
            state.selectionStart = start;
            state.selectionEnd = start + defaultURLLength;
        }
        return state
    }

    const symbol = '* * *';
    const symbolLength = symbol.length;
    function hr(state) {
        let { before, after, afterEdge } = padNewLines(state);
        const { selectionStart } = state;
        if (!after && afterEdge) {
            after = '\n\n';
        }
        state.value = stringSplice(state.value, selectionStart, state.selectionEnd, before + symbol + after);
        state.selectionStart = state.selectionEnd =
            selectionStart +
            before.length +
            symbolLength +
            2;
        return state
    }

    const lf = '\n';
    const lfLength = lf.length;
    function heading(state, level) {
        const { selectionStart, selectionEnd, value } = state;
        let brIndex = value.lastIndexOf(lf, selectionStart) + lfLength;
        const fragment = repeat('#', level) + ' ';
        state.value = stringSplice(value, brIndex, brIndex, fragment);
        state.selectionStart = selectionStart + fragment.length;
        state.selectionEnd = selectionEnd + fragment.length;
        return state
    }

    const restoreFns = {
        bold: tryUnWrap('**'),
        italic: tryUnWrap('_'),
        strikethrough: tryUnWrap('~~'),
        inlineCode: tryUnWrap('`'),
        blockCode,
        ul: tryUnlist('\\-\\s'),
        ol: tryUnlist('\\d+\\.\\s'),
        quote: tryUnlist('>\\s'),
        task: tryUnlist('\\-\\s\\[[\\sx]\\]\\s')
    };
    function tryRestore(state, type) {
        return restoreFns[type](state)
    }
    function tryUnWrap(char) {
        return function (state) {
            const { value, selectionStart, selectionEnd } = state;
            const { length } = char;
            const wrapStart = selectionStart - length;
            if (wrapStart < 0)
                return false
            const wrapEnd = selectionEnd + length;
            if (wrapEnd > value.length)
                return false
            const startChar = value.slice(wrapStart, selectionStart);
            if (startChar !== char)
                return false
            const endChar = value.slice(selectionEnd, wrapEnd);
            if (startChar !== endChar)
                return false
            const selectedStr = value.slice(selectionStart, selectionEnd);
            state.value = stringSplice(value, wrapStart, wrapEnd, selectedStr);
            state.selectionStart = wrapStart;
            state.selectionEnd = wrapStart + selectedStr.length;
            return true
        }
    }
    function blockCode(state) {
        const { value, selectionStart, selectionEnd } = state;
        const { length } = value;
        let wrapEnd = selectionEnd + 4;
        if (wrapEnd > length)
            return false
        let endEdge;
        if (wrapEnd === length) {
            endEdge = true;
        }
        else {
            wrapEnd += 1;
        }
        if (value.slice(selectionEnd, wrapEnd) !== '\n```' + (endEdge ? '' : '\n')) {
            return false
        }
        const prevInedex = selectionStart - 1;
        if (value[prevInedex] !== '\n')
            return false
        let wrapStart = value.lastIndexOf('\n', prevInedex - 1);
        let startEdge;
        if (wrapStart < 0) {
            wrapStart = 0;
            startEdge = true;
        }
        if (value.slice(wrapStart, wrapStart + (startEdge ? 3 : 4)) !==
            (startEdge ? '' : '\n') + '```') {
            return false
        }
        const selectedStr = value.slice(selectionStart, selectionEnd);
        state.value = stringSplice(value, wrapStart, wrapEnd, selectedStr);
        state.selectionStart = wrapStart;
        state.selectionEnd = wrapStart + selectedStr.length;
        return true
    }
    function tryUnlist(regStr) {
        return function (state) {
            const { value, selectionStart, selectionEnd } = state;
            const startIndex = value.lastIndexOf('\n', selectionStart - 1) + 1;
            const beforeStr = value.slice(startIndex, selectionStart);
            if (createRegExp(`^${regStr}$`).test(beforeStr)) {
                const { length } = beforeStr;
                state.value = stringSplice(value, startIndex, selectionStart);
                state.selectionStart = selectionStart - length;
                state.selectionEnd = selectionEnd - length;
                return true
            }
            const selectedStr = value.slice(selectionStart, selectionEnd);
            const wholeReg = createRegExp(`^(${regStr}[^\\n]*\\n?)+$`);
            if (!wholeReg.test(selectedStr))
                return false
            const tripSymbol = selectedStr.replace(createRegExp(regStr, 'g'), '');
            state.value = stringSplice(value, selectionStart, selectionEnd, tripSymbol);
            state.selectionStart = selectionStart;
            state.selectionEnd = selectionEnd - (selectedStr.length - tripSymbol.length);
            return true
        }
    }
    const regExpMap = {};
    function createRegExp(str, flag) {
        const cacheKey = str + (flag || '');
        return regExpMap[cacheKey] || (regExpMap[cacheKey] = new RegExp(str, flag))
    }

    const defaultOptions = {
        maxRecords: 50,
        saveDelay: 3000,
        onSave: noop
    };
    class TinyMDE {
        constructor(el, options) {
            const op = (this.options = assign({}, defaultOptions, options));
            let element;
            if (typeof el === 'string') {
                const queryElement = document.querySelector(el);
                if (queryElement instanceof HTMLTextAreaElement) {
                    element = queryElement;
                }
                else {
                    throw new TypeError('必须是一个 textarea 元素。')
                }
            }
            else if (typeof el === 'function') {
                element = document.createElement('textarea');
                el(element);
            }
            else {
                element = el;
            }
            this.el = element;
            this.history = new StateHistory(element, op.maxRecords);
            addEvent(element, 'input', debounce(() => {
                this.saveState();
                op.onSave();
            }, op.saveDelay));
        }
        saveState() {
            this.history.push();
        }
        undo() {
            this.history.go(-1);
            this.el.focus();
        }
        redo() {
            this.history.go(1);
            this.el.focus();
        }
        bold() {
            this.manipulate(() => {
                wrap(this.el, '**');
            }, 'bold');
        }
        italic() {
            this.manipulate(() => {
                wrap(this.el, '_');
            }, 'italic');
        }
        strikethrough() {
            this.manipulate(() => {
                wrap(this.el, '~~');
            }, 'strikethrough');
        }
        inlineCode() {
            this.manipulate(() => {
                wrap(this.el, '`');
            }, 'inlineCode');
        }
        blockCode() {
            this.manipulate(() => {
                const newlinePad = padNewLines(this.el);
                wrap(this.el, {
                    intro: newlinePad.before + '```\n',
                    outro: '\n```' + newlinePad.after
                });
            }, 'blockCode');
        }
        ul() {
            this.manipulate(() => {
                list(this.el, '- ');
            }, 'ul');
        }
        ol() {
            this.manipulate(() => {
                list(this.el, index => `${index + 1}. `);
            }, 'ol');
        }
        quote() {
            this.manipulate(() => {
                list(this.el, '> ');
            }, 'quote');
        }
        task() {
            this.manipulate(() => {
                list(this.el, '- [ ] ');
            }, 'task');
        }
        link(url, text) {
            this.manipulate(() => {
                linkOrImage(this.el, url, text, true);
            });
        }
        image(url, text) {
            this.manipulate(() => {
                linkOrImage(this.el, url, text);
            });
        }
        hr() {
            this.manipulate(() => {
                hr(this.el);
            });
        }
        heading(level) {
            this.manipulate(() => {
                heading(this.el, level);
            });
        }
        manipulate(action, type) {
            if (!type || !tryRestore(this.el, type)) {
                this.saveState();
                action();
            }
            this.saveState();
            this.el.focus();
        }
    }

    return TinyMDE;

}));
//# sourceMappingURL=tinymde.js.map
