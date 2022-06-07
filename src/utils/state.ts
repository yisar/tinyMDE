import { IState } from '../types'

export function copy(state: IState) {
  return {
    selectionStart: state.selectionStart,
    selectionEnd: state.selectionEnd,
    value: state.value
  }
}

export function merge(target: IState, newState: IState) {
  // 需要先设置 value，否则选中位置会被重置到文本末尾
  target.value = newState.value
  target.selectionStart = newState.selectionStart
  target.selectionEnd = newState.selectionEnd
}

export function isEqual(a: IState, b: IState) {
  if (!a || !b) return false
  return (
    a.value === b.value &&
    a.selectionStart === b.selectionStart &&
    a.selectionEnd === b.selectionEnd
  )
}
