export type TaggedLiteral = [TemplateStringsArray, ...any[]]
export type Stringify = (value: any) => string
export type Mergeable = TaggedLiteral | any
const isArray = <T extends unknown>(arr: T): arr is T extends any[] ? T : never =>
  Array.isArray(arr)
const isMergeableArray = (arr: any): arr is Mergeable[] =>
  isArray(arr) && !isTaggedLiteral(arr)
const isTemplateStringsArray = (value: any): value is TemplateStringsArray =>
  isArray(value) &&
  'raw' in value &&
  isArray(value.raw) &&
  value.raw.length === value.length

const isTaggedLiteral = (arg: any): arg is TaggedLiteral =>
  isArray(arg) &&
  arg.length > 0 &&
  isTemplateStringsArray(arg[0]) &&
  arg[0].length === arg.length

const createTaggedLiteral = (
  strings: string[],
  stringsRaw: string[],
  values: any[],
): TaggedLiteral => {
  const ref = Object.assign([], strings) as unknown as TemplateStringsArray
  Object.defineProperty(ref, 'raw', {
    value: Object.freeze(stringsRaw),
    enumerable: false,
    writable: false,
    configurable: false,
  })
  Object.freeze(ref)
  return [ref, ...values]
}
const frogmentLike = (str: string): TaggedLiteral => {
  const strings = [str]
  const stringsRaw = [str]
  const values: any[] = []
  return createTaggedLiteral(strings, stringsRaw, values)
}
const flattenfrogments = (input: TaggedLiteral): TaggedLiteral => {
  const flatStrings: string[] = []
  const flatValues: any[] = []

  const [strings, ...values] = input

  for (let i = 0; i < strings.length; i++) {
    let currentString = strings[i]
    let currentValue = values[i]

    if (isMergeableArray(currentValue))
      currentValue = concatfrogments(...currentValue)

    if (i < values.length && isTaggedLiteral(currentValue)) {
      const [nestedStrings, ...nestedValues] = flattenfrogments(currentValue)
      currentString += nestedStrings[0]
      if (flatStrings.length === 0) {
        flatStrings.push(currentString)
      } else {
        flatStrings[flatStrings.length - 1] += currentString
      }

      for (let j = 1; j < nestedStrings.length - 1; j++) {
        flatStrings.push(nestedStrings[j])
      }

      if (nestedStrings.length > 1) {
        flatStrings.push(nestedStrings[nestedStrings.length - 1])
      }

      flatValues.push(...nestedValues)
    } else {
      if (flatStrings.length === 0) {
        flatStrings.push(currentString)
      } else {
        flatStrings[flatStrings.length - 1] += currentString
      }

      if (i < values.length) {
        flatValues.push(currentValue)
        flatStrings.push('')
      }
    }
  }

  return createTaggedLiteral(flatStrings, flatStrings, flatValues)
}
const concatfrogments = (...frogments: Mergeable[]): TaggedLiteral => {
  const resultStrings = ['']
  const resultStringsRaw = ['']
  const resultValues: any = []
  const sanitized = frogments.filter(
    (t) => t !== null && t !== undefined && t !== '',
  )

  sanitized.forEach((current) => {
    if (typeof current === 'string') current = frogmentLike(current)
    if (isMergeableArray(current)) current = joinfrogments(current)
    const c = current
    const [originalStrings, ...originalValues] = c
    const originalStringsRaw = originalStrings.raw
    const strings = [...originalStrings]
    const stringsRaw = [...originalStringsRaw]
    const values = [...originalValues]

    const [firstString, ...restStrings] = strings
    const [firstStringRaw, ...restStringsRaw] = stringsRaw

    resultStrings[resultStrings.length - 1] += firstString
    resultStringsRaw[resultStringsRaw.length - 1] += firstStringRaw
    resultStrings.push(...restStrings)
    resultStringsRaw.push(...restStringsRaw)
    resultValues.push(...values)
  })
  return createTaggedLiteral(resultStrings, resultStringsRaw, resultValues)
}
const joinfrogments = (
  templates: Mergeable[],
  delimiter: string = '',
): TaggedLiteral => {
  const sanitized = templates.filter((t) => t !== null && t !== undefined)
  let result = frogment('')
  sanitized.forEach((arg, index) => {
    if (index > 0) result = concatfrogments(result, delimiter, arg)
    else result = typeof arg === 'string' ? frogmentLike(arg) : arg
  })
  return result
}
const frogment: frogment = function (
  ...args: TaggedLiteral | Mergeable[]
): TaggedLiteral {
  if (isTaggedLiteral(args)) args = [flattenfrogments(args)]
  return concatfrogments(...args)
}
const createDump = (stringify: Stringify) => {
  const fn = function dump(...args: any[]): string {
    let strings: TemplateStringsArray
    let values: any[] = []
    if (args.length === 1 && isTaggedLiteral(args[0])) {
      const frogment = args[0]
      strings = args[0][0]
      values = frogment.slice(1)
    } else {
      strings = args[0]
      values = args.slice(1)
    }
    return strings.reduce((acc, str, i) => {
      const value = i < values.length ? stringify(values[i]) : ''
      return acc + str + value
    }, '')
  }
  return {
    dump: fn,
    dumpLog: (...args: any[]) => {
      const result = fn(...args)
      console.log(result)
      return result
    },
  }
}
const { dump, dumpLog } = createDump(String)
frogment.dump = dump
frogment.dumpLog = dumpLog
frogment.join = joinfrogments
frogment.createDump = createDump
export interface frogment {
  /**
   * Creates a tagged template string representation from a plain string.
   *
   * This is useful for injecting raw SQL/text directly without any interpolated
   * values.
   *
   * @example
   *   ```ts
   *   frogment('SELECT * FROM users')
   *   frogment(`${NON_PORTAL_VALUE} NON PORTAL VALUE`)
   *   ```
   *
   * @param str - A plain string to be treated as a tagged string.
   * @returns A `TaggedLiteral` containing the input string.
   */
  (str: string): TaggedLiteral
  /**
   * Creates a `TaggedLiteral` from a tagged template literal.
   *
   * Supports interpolated values including nested `TaggedLiteral`s, which will
   * be automatically flattened and merged.
   *
   * This is the primary and most powerful way to construct reusable tagged
   * frogments.
   *
   * @example
   *   Basic usage:
   *   ```ts
   *   const id = 42
   *   frogment`SELECT * FROM users WHERE id = ${id}`
   *   ```
   *
   * @example
   *   Nested `TaggedLiteral`s:
   *   ```ts
   *   const condition1 = frogment`age > ${18}`
   *   const condition2 = frogment`status = ${'active'}`
   *   const where = frogment`WHERE ${condition1} AND ${condition2}`
   *   // Result: [ ["WHERE age > ", " AND status = ", ""], 18, "active" ]
   *   ```
   *
   * @param strings - The template strings array (automatically provided by JS
   *   engine).
   * @param values - The interpolated values, which may include nested
   *   `TaggedLiteral`s.
   * @returns A flattened and merged `TaggedLiteral`.
   */
  (strings: TemplateStringsArray, ...values: any[]): TaggedLiteral
  /**
   * Combines multiple `TaggedLiteral` or `string` frogments into a single
   * `TaggedLiteral`.
   *
   * This is used to concatenate parts, useful for composing complex queries or
   * nested tagged strings.
   *
   * Automatically flattens nested `TaggedLiteral` values and merges string
   * frogments.
   *
   * @example
   *   ```ts
   *   const condition = frogment`age > ${18}`
   *   const clause = frogment('WHERE ', condition)
   *   ```
   *
   * @param args - A list of `TaggedLiteral` or plain strings.
   * @returns A single flattened and merged `TaggedLiteral`.
   */
  (...args: Mergeable[]): TaggedLiteral

  /**
   * Joins multiple `TaggedLiteral` frogments with a specified delimiter.
   *
   * `joinfrogments` is useful when you have several tagged template parts
   * (e.g., SQL conditions, string frogments) that need to be combined into a
   * single `TaggedLiteral`, with a custom delimiter (such as `" AND "` or `",
   * "`).
   *
   * The resulting `TaggedLiteral` is flattened and normalized so that the
   * structure remains valid (i.e., `strings.length === values.length + 1`).
   *
   * @example
   *   Basic usage:
   *   ```ts
   *   const cond1 = frogment`age > ${18}`
   *   const cond2 = frogment`status = ${'active'}`
   *   const joined = frogment.join([cond1, cond2], ' AND ')
   *   // Result generates same as frogment`age > ${18} AND status = ${'active'}`
   *   ```
   *
   * @example
   *   Deeply nested composition:
   *   ```ts
   *   const conds = [
   *   frogment`a = ${1}`,
   *   frogment`b = ${2}`,
   *   frogment`c = ${3}`,
   *   ]
   *   const complex = frogment.join(conds, ' OR ')
   *   // Result generates same as frogment`a = ${1} OR b = ${2} OR c = ${3}`
   *   ```
   *
   * @param taggedStrings - An array of `TaggedLiteral` frogments to join.
   * @param delimiter - The string inserted between each frogment.
   * @returns A normalized and flattened `TaggedLiteral` combining all parts
   *   with the given delimiter.
   */
  join: typeof joinfrogments

  /**
   * Converts a TaggedLiteral ([TemplateStringsArray, ...any[]]) into a single
   * flat string by interpolating all values in order.
   *
   * @example
   *   ```ts
   *   dump(frogment`SELECT * FROM users WHERE id = ${42}`)
   *   // "SELECT * FROM users WHERE id = 42"
   *   // or it accepts literal syntax too
   *   dump`SELECT * FROM users WHERE id = ${42}`
   *   // "SELECT * FROM users WHERE id = 42"
   *   ```
   */
  dump: frogmentDump

  /**
   * Logs the frogment to the console.
   *
   * @example
   *   ```ts
   *   dumpLog(frogment`SELECT * FROM users WHERE id = ${42}`)
   *   // "SELECT * FROM users WHERE id = 42"
   *   ```
   */
  dumpLog: frogmentDump

  /**
   * Creates a dump function with a custom stringify function. Useful for using
   * tools like bun.sql or postgresjs
   *
   * @example
   *   ```ts
   *   const dump = frogment.createDump((value) => {
   *   return typeof value === 'string' ? value : String(value)
   *   })
   *   dump(frogment`SELECT * FROM users WHERE id = ${42}`)
   *   // "SELECT * FROM users WHERE id = 42"
   *   ```
   */
  createDump: (stringify: Stringify) => {
    dump: frogmentDump
    dumpLog: frogmentDump
  }
}
interface frogmentDump {
  (...args: TaggedLiteral): string
  (frogment: TaggedLiteral): string
}

export default frogment
