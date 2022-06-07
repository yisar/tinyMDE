import { IState } from '../types'
import repeat from './string-repeat'

/**
 * 一些方法需要在前后补充换行符，例如 blockCode() 和 list()。
 * 这个方法根据当前的状态判断前后需要补充多少个换行符。
 * @param state 编辑器的状态
 * @param count 前后要满足多少个换行符，一般是 2 个
 */
export default function(state: IState, count = 2) {
  const { selectionStart, selectionEnd, value } = state

  // 先检查需要多少个前置换行符
  let before = count
  let beforeEdge = false
  for (let i = 1; i <= count; i++) {
    const startIndex = selectionStart - i
    if (startIndex < 0) {
      before = 0
      beforeEdge = true
      break
    }
    if (value[startIndex] === '\n') {
      before -= 1
    } else {
      break
    }
  }

  // 再检查需要多少个后置换行符
  const { length } = value
  let after = count
  let afterEdge = false
  for (let i = 0; i < count; i++) {
    const endIndex = selectionEnd + i
    if (endIndex >= length) {
      after = 0
      afterEdge = true
      break
    }
    if (value[endIndex] === '\n') {
      after -= 1
    } else {
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
