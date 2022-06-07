export interface IRepeatFunc {
  (str: string, count: number): string
}

/**
 * 重复字符串
 */
const repeat: IRepeatFunc = String.prototype.repeat
  ? /* istanbul ignore next */
    function(str, count) {
      return str.repeat(count)
    }
  : function(str, count) {
      let s = ''
      for (let i = 0; i < count; i++) {
        s += str
      }
      return s
    }

export default repeat
