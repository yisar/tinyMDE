export interface IAnyFunc {
  (...a: any[]): any
}

export default function(func: IAnyFunc, timeout = 250) {
  let timeId: number
  return function(this: any, ...args: any[]) {
    window.clearTimeout(timeId)
    timeId = window.setTimeout(() => {
      func.apply(this, args)
    }, timeout)
  }
}
