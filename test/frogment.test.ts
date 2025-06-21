import { expect, it } from 'vitest'
import frogment from '../src/frogment'

const mock = (strings: TemplateStringsArray, ...args: any[]) => {
  return [strings, ...args]
}
it('should parse frogments with plain string', () => {
  const result = frogment('Hello')
  expect(result).toEqual(mock`Hello`)
  expect(result.length).toBe(1)
})
it('should join conditions with AND using joinfrogments', () => {
  const cond1 = frogment`age > ${18}`
  const cond2 = frogment`status = ${'active'}`
  const joined = frogment.join([cond1, cond2], ' AND ')
  expect(joined).toEqual(mock`age > ${18} AND status = ${'active'}`)
})
it('should join without delimiter on template', () => {
  const cond1 = frogment`age > ${18} AND `
  const cond2 = frogment`status = ${'active'}`
  const joined = frogment`WHERE ${[cond1, cond2]}`
  expect(joined).toEqual(mock`WHERE age > ${18} AND status = ${'active'}`)
})
it('joins a nested array of frogments', () => {
  const a = frogment`a = ${1}`
  const b = frogment`b = ${2}`
  const c = frogment`c = ${3}`
  const conds = [[a, ' AND ', b], ' AND ', c]
  const query = frogment`WHERE ${conds}`

  expect(query).toEqual(mock`WHERE a = ${1} AND b = ${2} AND c = ${3}`)
})
it('joins multiple levels of nesting with strings and frogments', () => {
  const cond1 = frogment`a = ${1}`
  const cond2 = ' AND '
  const cond3 = frogment`b = ${2}`
  const conds = [[cond1, cond2], [cond3]]
  const query = frogment`WHERE ${conds}`

  expect(query).toEqual(mock`WHERE a = ${1} AND b = ${2}`)
})
it('joins deeply nested empty arrays gracefully', () => {
  const query = frogment`WHERE ${[[[], []], []]}`
  expect(query).toEqual(mock`WHERE `)
})
it('joins nested frogments with mixed types', () => {
  const conds = [
    frogment`a = ${1} AND `,
    [frogment`b = ${2}`, ' AND ', frogment`c = ${3}`],
    null,
    undefined,
    '',
  ]
  const query = frogment`WHERE ${conds}`
  expect(query).toEqual(mock`WHERE a = ${1} AND b = ${2} AND c = ${3}`)
})
it('works with array inside interpolated clause (without delimiter)', () => {
  const conds = [frogment`x = ${'xval'} AND `, frogment`y = ${'yval'}`]
  const query = frogment`SELECT * FROM table WHERE ${[conds]}`
  expect(query).toEqual(
    mock`SELECT * FROM table WHERE x = ${'xval'} AND y = ${'yval'}`,
  )
})
it('correctly handles array of TaggedLiteral + string mix at multiple levels', () => {
  const part1 = frogment`x = ${1}`
  const part2 = ' OR '
  const part3 = frogment`y = ${2}`
  const query = frogment`(${[[part1, part2], part3]})`
  expect(query).toEqual(mock`(x = ${1} OR y = ${2})`)
})
it('should join some nested frogments', () => {
  const select = frogment`SELECT`
  const fields = frogment.join([frogment`${1}`, frogment`${2}`], ', ')
  const from = frogment`FROM`
  const table = frogment`${3}`
  const where = frogment`WHERE`
  const condition = frogment`age > ${18}`
  const inline = frogment`${select} ${fields} ${from} ${table} ${where} ${condition}`
  const merge = frogment(
    select,
    ' ',
    fields,
    ' ',
    from,
    ' ',
    table,
    ' ',
    where,
    ' ',
    condition,
  )
  expect(inline).toEqual(mock`SELECT ${1}, ${2} FROM ${3} WHERE age > ${18}`)
  expect(merge).toEqual(mock`SELECT ${1}, ${2} FROM ${3} WHERE age > ${18}`)
})
it('should flatten deeply nested frogments', () => {
  const cond1 = frogment`a = ${1}`
  const cond2 = frogment`b = ${2}`
  const cond3 = frogment`${cond1} AND ${cond2}`

  const cond4 = frogment`c = ${3}`
  const cond5 = frogment`${cond3} OR ${cond4}`

  const result = frogment`${cond5} AND d = ${4}`

  // Beklenen sonuç: a = 1 AND b = 2 OR c = 3 AND d = 4
  expect(result).toEqual(mock`a = ${1} AND b = ${2} OR c = ${3} AND d = ${4}`)
})
it('should handle empty string correctly', () => {
  const result = frogment``
  expect(result).toEqual(mock``)
})
it('should handle a single interpolation only', () => {
  const result = frogment`${42}`
  expect(result).toEqual(mock`${42}`)
})
it('should support nested joinfrogments inside frogments', () => {
  const where1 = frogment`a = ${1}`
  const where2 = frogment`b = ${2}`
  const where3 = frogment`c = ${3}`
  const conditions = frogment.join([where1, where2, where3], ' AND ')
  const query = frogment`WHERE ${conditions}`

  expect(query).toEqual(mock`WHERE a = ${1} AND b = ${2} AND c = ${3}`)
})
it('should allow raw strings between frogments', () => {
  const part1 = frogment`id = ${1}`
  const part2 = frogment`AND`
  const part3 = frogment`active = ${true}`
  const result = frogment`${part1} ${part2} ${part3}`

  expect(result).toEqual(mock`id = ${1} AND active = ${true}`)
})
it('should support joinfrogments used directly inside a frogment', () => {
  const fields = [frogment`name`, frogment`age`, frogment`email`]
  const result = frogment`SELECT ${frogment.join(fields, ', ')} FROM users`

  expect(result).toEqual(mock`SELECT name, age, email FROM users`)
})
it('should handle boolean and null values', () => {
  const result = frogment`active = ${true} AND deleted = ${null}`
  expect(result).toEqual(mock`active = ${true} AND deleted = ${null}`)
})
it('should join simple frogments in array with no values', () => {
  const parts = [frogment`A`, frogment`B`, frogment`C`]
  const result = frogment.join(parts, ' | ')
  expect(result).toEqual(mock`A | B | C`)
})
it('should support frogments with only string arguments', () => {
  const result = frogment('SELECT', ' * ', 'FROM users')
  expect(result).toEqual(mock`SELECT * FROM users`)
})
it('should handle joinfrogments with a single element', () => {
  const single = frogment`a = ${1}`
  const result = frogment.join([single], ' AND ')
  expect(result).toEqual(mock`a = ${1}`)
})
it('should join mix of raw strings and frogments strings', () => {
  const a = frogment`a = ${1}`
  const b = 'AND'
  const c = frogment`b = ${2}`
  const result = frogment.join([a, b, c], ' ')
  expect(result).toEqual(mock`a = ${1} AND b = ${2}`)
})
it('should flatten mix of raw strings and frogments in frogment()', () => {
  const result = frogment('SELECT ', frogment`*`, ' FROM users')
  expect(result).toEqual(mock`SELECT * FROM users`)
})
it('should handle empty string with interpolation', () => {
  const result = frogment` ${123} `
  expect(result).toEqual(mock` ${123} `)
})
it('should join with empty delimiter', () => {
  const parts = [frogment`A`, frogment`B`]
  const result = frogment.join(parts, '')
  expect(result).toEqual(mock`AB`)
})
it('should support undefined and mixed types', () => {
  const result = frogment`${1} ${true} ${null} ${undefined}`
  expect(result).toEqual(mock`${1} ${true} ${null} ${undefined}`)
})
it('should dump a frogment with multiple values', () => {
  const result = frogment`SELECT * FROM users WHERE id = ${1} AND name = ${'John'}`
  expect(frogment.dump(result)).toEqual(
    'SELECT * FROM users WHERE id = 1 AND name = John',
  )
})
it('should dump a frogment with no values', () => {
  const result = frogment`SELECT * FROM users`
  expect(frogment.dump(result)).toEqual('SELECT * FROM users')
})
it('should dump a frogment', () => {
  const result = frogment`SELECT * FROM users WHERE id = ${1}`
  expect(frogment.dump(result)).toEqual('SELECT * FROM users WHERE id = 1')
})
it('should resolve a frogment in a frogment', () => {
  const inner = frogment`id = ${1}`
  const outer = frogment(inner)
  expect(outer).toEqual(mock`id = ${1}`)
})
it('should resolve a frogment in a frogment in a frogment', () => {
  const inner = frogment`id = ${1}`
  const middle = frogment(inner)
  const outer = frogment`${middle}`
  expect(outer).toEqual(mock`id = ${1}`)
})
it('should dump allow literal syntax', () => {
  const result = frogment.dump`SELECT * FROM users WHERE id = ${1}`
  expect(result).toEqual('SELECT * FROM users WHERE id = 1')
})
it('should dump allow frogment syntax', () => {
  const result = frogment.dump(frogment`SELECT * FROM users WHERE id = ${1}`)
  expect(result).toEqual('SELECT * FROM users WHERE id = 1')
})
it('should dump with custom stringify function', () => {
  const user = {
    state: 'active',
    value: 1
  }
  const stringify = (value:any) => {
    return typeof value === 'object' && "value" in value ? String(user.value) : String(value)
  }
  const result = frogment.createDump(stringify)
  expect(result.dump(frogment`SELECT * FROM users WHERE id = ${user}`)).toEqual(
    'SELECT * FROM users WHERE id = 1',
  )
})
it('should dump with custom stringify function on complex nested frogments', () => {
  const user = {
    state: 'active',
    value: 1,
  }
  const company = {
    state: 'active',
    value: 2,
  }
  const companyFrogment = frogment`${company}`
  const stringify = (value:any) => {
    return typeof value === 'object' && "value" in value ? String(value.value) : String(value)
  }
  const result = frogment.createDump(stringify)
  expect(result.dump(frogment`SELECT * FROM users WHERE id = ${user} AND company = ${companyFrogment}`)).toEqual(
    'SELECT * FROM users WHERE id = 1 AND company = 2',
  )
})