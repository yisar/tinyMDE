import { IState } from '../types'
import stringSplice from '../utils/string-splice'

export interface IInterOutro {
  intro: string
  outro: string
}

export type TStringOrIntroOutro = string | IInterOutro

function getInOut(inOut: TStringOrIntroOutro): IInterOutro {
  if (typeof inOut === 'string') {
    return {
      intro: inOut,
      outro: inOut
    }
  }
  return inOut
}

/**
 * 包裹用户选中文本的快捷方法。
 */
export default function(state: IState, introOutro: TStringOrIntroOutro) {
  const { intro, outro } = getInOut(introOutro)
  const { selectionStart, selectionEnd, value } = state
  state.value = stringSplice(
    value,
    selectionStart,
    selectionEnd,
    intro + value.slice(selectionStart, selectionEnd) + outro
  )
  const selectionOffset = intro.length
  state.selectionStart = selectionStart + selectionOffset
  state.selectionEnd = selectionEnd + selectionOffset
  return state
}
