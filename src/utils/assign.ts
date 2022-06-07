export type TAssignFunc = typeof Object.assign

const hasOwn = Object.prototype.hasOwnProperty

const assign: TAssignFunc =
  Object.assign ||
  function(target: any, ...args: any[]) {
    if (target == null) {
      throw new TypeError('Cannot convert undefined or null to object')
    }
    const to = Object(target)
    args.forEach(arg => {
      if (arg == null) return
      for (let key in arg) {
        if (hasOwn.call(arg, key)) {
          to[key] = arg[key]
        }
      }
    })
    return to
  }

export default assign
