import { IState } from '../types'
import splice from '../utils/string-splice'
import repeat from '../utils/string-repeat'

const lf = '\n'
const lfLength = lf.length

export default function(state: IState, level: 1 | 2 | 3 | 4 | 5 | 6) {
  const { selectionStart, selectionEnd, value } = state

  // 查找离光标最近的换行符
  let brIndex = value.lastIndexOf(lf, selectionStart) + lfLength

  // 插入 # 号
  const fragment = repeat('#', level) + ' '
  state.value = splice(value, brIndex, brIndex, fragment)
  state.selectionStart = selectionStart + fragment.length
  state.selectionEnd = selectionEnd + fragment.length
  return state
}
