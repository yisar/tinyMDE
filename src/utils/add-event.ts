/**
 * 注册事件的便捷方法。
 */
export default function<
  T extends EventTarget,
  K extends keyof HTMLElementEventMap
>(el: T, name: K, handler: (this: T, event: HTMLElementEventMap[K]) => void) {
  el.addEventListener(name, handler)
  return function() {
    el.removeEventListener(name, handler)
  }
}
