import stringSplice from '../utils/string-splice'
import { IState } from '../types'

export const restoreFns = {
  bold: tryUnWrap('**'),
  italic: tryUnWrap('_'),
  strikethrough: tryUnWrap('~~'),
  inlineCode: tryUnWrap('`'),
  blockCode,
  ul: tryUnlist('\\-\\s'),
  ol: tryUnlist('\\d+\\.\\s'),
  quote: tryUnlist('>\\s'),
  task: tryUnlist('\\-\\s\\[[\\sx]\\]\\s')
}

export type KeyOfRestoreFns = keyof typeof restoreFns

export default function(state: IState, type: KeyOfRestoreFns) {
  return restoreFns[type](state)
}

function tryUnWrap(char: string) {
  return function(state: IState) {
    const { value, selectionStart, selectionEnd } = state
    const { length } = char
    const wrapStart = selectionStart - length
    if (wrapStart < 0) return false
    const wrapEnd = selectionEnd + length
    if (wrapEnd > value.length) return false
    const startChar = value.slice(wrapStart, selectionStart)
    if (startChar !== char) return false
    const endChar = value.slice(selectionEnd, wrapEnd)
    if (startChar !== endChar) return false
    const selectedStr = value.slice(selectionStart, selectionEnd)
    state.value = stringSplice(value, wrapStart, wrapEnd, selectedStr)
    state.selectionStart = wrapStart
    state.selectionEnd = wrapStart + selectedStr.length
    return true
  }
}

function blockCode(state: IState) {
  const { value, selectionStart, selectionEnd } = state

  // 判断选中文本后四个字符是否是 \n```。如果没有触到文本结尾，则要多判断一个换行
  const { length } = value
  let wrapEnd = selectionEnd + 4
  if (wrapEnd > length) return false
  let endEdge
  if (wrapEnd === length) {
    endEdge = true
  } else {
    wrapEnd += 1
  }
  if (value.slice(selectionEnd, wrapEnd) !== '\n```' + (endEdge ? '' : '\n')) {
    return false
  }
  // 判断选中文本前一个字符是否是 \n
  const prevInedex = selectionStart - 1
  if (value[prevInedex] !== '\n') return false
  // 判断前面的一行是否以 \n``` 开头。如果触到了文本开头，则不要求有第一个换行符。
  let wrapStart = value.lastIndexOf('\n', prevInedex - 1)
  let startEdge
  if (wrapStart < 0) {
    wrapStart = 0
    startEdge = true
  }
  if (
    value.slice(wrapStart, wrapStart + (startEdge ? 3 : 4)) !==
    (startEdge ? '' : '\n') + '```'
  ) {
    return false
  }
  const selectedStr = value.slice(selectionStart, selectionEnd)
  // 暂时不要去掉额外的换行符
  // if (!startEdge && value[wrapStart - 1] === '\n') wrapStart -= 1
  // if (value[wrapEnd] === '\n') wrapEnd += 1
  state.value = stringSplice(value, wrapStart, wrapEnd, selectedStr)
  state.selectionStart = wrapStart
  state.selectionEnd = wrapStart + selectedStr.length
  return true
}

function tryUnlist(regStr: string) {
  return function(state: IState) {
    const { value, selectionStart, selectionEnd } = state
    // 先判断选中文本的前面一部分是否满足正则
    const startIndex = value.lastIndexOf('\n', selectionStart - 1) + 1
    const beforeStr = value.slice(startIndex, selectionStart)
    if (createRegExp(`^${regStr}$`).test(beforeStr)) {
      const { length } = beforeStr
      state.value = stringSplice(value, startIndex, selectionStart)
      state.selectionStart = selectionStart - length
      state.selectionEnd = selectionEnd - length
      return true
    }
    // 判断整个选中文本是否符合 list 条件
    const selectedStr = value.slice(selectionStart, selectionEnd)
    const wholeReg = createRegExp(`^(${regStr}[^\\n]*\\n?)+$`)
    if (!wholeReg.test(selectedStr)) return false

    const tripSymbol = selectedStr.replace(createRegExp(regStr, 'g'), '')
    state.value = stringSplice(value, selectionStart, selectionEnd, tripSymbol)
    state.selectionStart = selectionStart
    state.selectionEnd = selectionEnd - (selectedStr.length - tripSymbol.length)
    return true
  }
}

const regExpMap: { [regExpStr: string]: RegExp } = {}

function createRegExp(str: string, flag?: string) {
  const cacheKey = str + (flag || '')
  return regExpMap[cacheKey] || (regExpMap[cacheKey] = new RegExp(str, flag))
}
