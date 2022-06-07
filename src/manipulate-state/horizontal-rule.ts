import { IState } from '../types'
import padNewLines from '../utils/pad-newlines'
import splice from '../utils/string-splice'

const symbol = '* * *'
const symbolLength = symbol.length

/**
 * 水平分割线
 */
export default function(state: IState) {
  let { before, after, afterEdge } = padNewLines(state)
  const { selectionStart } = state
  if (!after && afterEdge) {
    after = '\n\n'
  }
  state.value = splice(
    state.value,
    selectionStart,
    state.selectionEnd,
    before + symbol + after
  )
  state.selectionStart = state.selectionEnd =
    selectionStart +
    before.length +
    symbolLength +
    2 /* 永远往后偏移两个字符，不管 after 的换行个数 */
  return state
}
