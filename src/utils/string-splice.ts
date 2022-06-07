/**
 * 一个针对字符串的类似于 Array#splice 的方法
 * @param str 要操作的字符串
 * @param start 修改的开始位置
 * @param end 修改的结束位置
 * @param insert 要插入的字符串
 * @example
 *   stringSplice('acd', 1, 0, 'b') => 'abcd'
 *   stringSplice('abcde', 1, 2) => 'ade'
 *   stringSplice('abcde', 1, 2, 'z') => 'azde'
 */
export default function(str: string, start: number, end: number, insert = '') {
  const startString = str.slice(0, start)
  const endString = str.slice(end)
  return startString + insert + endString
}
