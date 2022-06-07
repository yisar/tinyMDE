import { IState } from '../types'
import stringSplice from '../utils/string-splice'

const defaultURL = 'url'
const defaultURLLength = defaultURL.length

/**
 * link() 与 image() 的底层方法。
 */
export default function(state: IState, url = '', text = '', isLink?: boolean) {
  const { selectionStart, selectionEnd, value } = state
  const selectedText = value.slice(selectionStart, selectionEnd)

  if (!text) {
    text = selectedText
  }

  let noUrl

  if (!url) {
    noUrl = true
    url = defaultURL
  }

  let intro = (isLink ? '' : '!') + '['

  const outroIn = ']('
  const outroOut = ')'

  const newString = intro + text + outroIn + url + outroOut

  state.value = stringSplice(value, selectionStart, selectionEnd, newString)

  if (!noUrl && text) {
    // 如果既有 url 也有 text，则将光标放在最后面
    state.selectionEnd = state.selectionStart =
      selectionStart + newString.length
  } else if (!text) {
    // 如果没有描述，则将光标放在描述里
    state.selectionStart = state.selectionEnd = selectionStart + intro.length
  } else {
    // 如果有描述但没有 url，则将光标放在 url 里
    const start = selectionStart + intro.length + text.length + outroIn.length
    state.selectionStart = start
    state.selectionEnd = start + defaultURLLength
  }
  return state
}
