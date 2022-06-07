import noop from './utils/noop'
import addEvent from './utils/add-event'
import debounce from './utils/debounce'
import padNewLines from './utils/pad-newlines'
import assign from './utils/assign'

import StateHistory from './StateHistory'

import wrap from './manipulate-state/wrap'
import list from './manipulate-state/list'
import linkOrImage from './manipulate-state/link-or-image'
import hr from './manipulate-state/horizontal-rule'
import heading from './manipulate-state/heading'
import tryRestore, { KeyOfRestoreFns } from './manipulate-state/try-restore'

export interface IVoidFunc {
  (): void
}

export interface IOptions {
  maxRecords?: number
  saveDelay?: number
  onSave?: IVoidFunc
}

const defaultOptions = {
  maxRecords: 50,
  saveDelay: 3000,
  onSave: noop
}

export default class {
  readonly el: HTMLTextAreaElement
  private readonly options: IOptions
  private readonly history: StateHistory

  constructor(
    el: string | HTMLTextAreaElement | ((el: HTMLTextAreaElement) => void),
    options?: IOptions
  ) {
    const op = (this.options = assign({}, defaultOptions, options))

    let element: HTMLTextAreaElement
    if (typeof el === 'string') {
      const queryElement = document.querySelector(el)
      if (queryElement instanceof HTMLTextAreaElement) {
        element = queryElement
      } else {
        throw new TypeError('必须是一个 textarea 元素。')
      }
    } else if (typeof el === 'function') {
      element = document.createElement('textarea')
      el(element)
    } else {
      element = el
    }
    this.el = element
    this.history = new StateHistory(element, op.maxRecords)

    addEvent(
      element,
      'input',
      debounce(() => {
        this.saveState()
        op.onSave()
      }, op.saveDelay)
    )
  }

  saveState() {
    this.history.push()
  }

  undo() {
    this.history.go(-1)
    this.el.focus()
  }

  redo() {
    this.history.go(1)
    this.el.focus()
  }

  bold() {
    this.manipulate(() => {
      wrap(this.el, '**')
    }, 'bold')
  }

  italic() {
    this.manipulate(() => {
      wrap(this.el, '_')
    }, 'italic')
  }

  strikethrough() {
    this.manipulate(() => {
      wrap(this.el, '~~')
    }, 'strikethrough')
  }

  inlineCode() {
    this.manipulate(() => {
      wrap(this.el, '`')
    }, 'inlineCode')
  }

  blockCode() {
    this.manipulate(() => {
      const newlinePad = padNewLines(this.el)
      wrap(this.el, {
        intro: newlinePad.before + '```\n',
        outro: '\n```' + newlinePad.after
      })
    }, 'blockCode')
  }

  ul() {
    this.manipulate(() => {
      list(this.el, '- ')
    }, 'ul')
  }

  ol() {
    this.manipulate(() => {
      list(this.el, index => `${index + 1}. `)
    }, 'ol')
  }

  quote() {
    this.manipulate(() => {
      list(this.el, '> ')
    }, 'quote')
  }

  task() {
    this.manipulate(() => {
      list(this.el, '- [ ] ')
    }, 'task')
  }

  link(url?: string, text?: string) {
    this.manipulate(() => {
      linkOrImage(this.el, url, text, true)
    })
  }

  image(url?: string, text?: string) {
    this.manipulate(() => {
      linkOrImage(this.el, url, text)
    })
  }

  hr() {
    this.manipulate(() => {
      hr(this.el)
    })
  }

  heading(level: 1 | 2 | 3 | 4 | 5 | 6) {
    this.manipulate(() => {
      heading(this.el, level)
    })
  }

  private manipulate(action: () => void, type?: KeyOfRestoreFns) {
    if (!type || !tryRestore(this.el, type)) {
      this.saveState()
      action()
    }
    this.saveState()
    this.el.focus()
  }
}
