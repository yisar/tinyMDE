import { copy, merge, isEqual } from './utils/state'
import { IState } from './types'

export default class StateHistory {
  history: IState[]
  current: number
  private readonly state: IState
  private readonly max: number

  constructor(state: IState, max: number) {
    this.state = state
    this.max = max
    this.clear()
    this.push()
  }

  push() {
    const { history, current, state } = this
    if (isEqual(history[current], state)) return

    const copyState = copy(state)
    // 删除后面的状态并添加新状态
    history.splice(current + 1, history.length - current, copyState)
    // 如果更新后记录超出最大记录数则删除最前面的记录
    if (history.length > this.max) {
      history.shift()
    } else {
      // 否则更新当前索引
      this.current += 1
    }
  }

  go(count: number) {
    const newIndex = this.current + count
    if (newIndex >= 0 && newIndex < this.history.length) {
      this.current = newIndex
      merge(this.state, this.history[newIndex])
    }
  }

  clear() {
    this.history = []
    this.current = -1
  }
}
