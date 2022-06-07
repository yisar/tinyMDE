import { IState } from '../types'
import padNewlines from '../utils/pad-newlines'
import stringSplice from '../utils/string-splice'

export interface ISymbolFunc {
  (index: number): string
}

const brReg = /\n{1}/g

/**
 * 列表的底层方法。
 * @param pattern 每一行后面要添加的前缀，可以提供一个方法动态生成，例如有序列表就需要添加递增的数字前缀
 */
export default function(state: IState, pattern: string | ISymbolFunc) {
  let symbolFunc: ISymbolFunc

  if (typeof pattern === 'string') {
    symbolFunc = () => pattern
  } else {
    symbolFunc = pattern
  }

  const { before, after } = padNewlines(state)

  const { selectionStart, selectionEnd, value } = state
  const selectedString = value.slice(selectionStart, selectionEnd)

  // 在选中的文本中查找满足个数的换行符并添加列表符号
  let index = 0
  // 生成要在开头添加的前缀
  const firstSymbol = symbolFunc(index)
  let newString = selectedString.replace(brReg, match => {
    index += 1
    return match + symbolFunc(index)
  })

  // 最终的文本 = 前置换行符 + 第一个列表符号 + 在内容中添加过列表符号的文本 + 后置换行符
  newString = before + firstSymbol + newString + after

  state.value = stringSplice(value, selectionStart, selectionEnd, newString)

  if (selectedString) {
    // 因为不想选中前后添加的换行符，
    // 所以选中的开始位置要加上前置换行符的长度，
    // 选中的结束位置要减去后置换行符的长度；
    // 当只有一行列表时，不选中第一个符号。
    state.selectionStart =
      selectionStart + before.length + (index ? 0 : firstSymbol.length)
    state.selectionEnd = selectionStart + newString.length - after.length
  } else {
    // 若没有选中文本，则直接将光标置于符号后面
    state.selectionStart = state.selectionEnd =
      selectionStart + before.length + firstSymbol.length
  }
  return state
}
