
# 🐸 Frogment

A powerful utility for composing and managing tagged template literals in JavaScript and TypeScript. While Frogment has been tested extensively with SQL query composition, its flexible design allows it to be used for a variety of templating and string composition tasks where preserving interpolation structure is important.

---

## 🤔 Why Frogment?

Working with tagged template literals is common in many JS libraries, especially for SQL query building. However, combining multiple fragments or nested templates while preserving interpolation boundaries can be tricky and error-prone.

Frogment provides a robust and intuitive way to:

- Compose fragments from strings and nested fragments
- Join arrays of fragments with custom delimiters
- Flatten deeply nested fragments into a single tagged template literal structure
- Extract (dump) the final string with all interpolations rendered

This allows safer and cleaner dynamic template composition without losing interpolation metadata, which is essential for libraries that consume or transform these literals further.

---

## 📦 Installation

```bash
npm install frogment
# or your favorite package manager
```

## 🚀 Basic Usage Example

```js
import frogment from 'frogment'

const where1 = frogment`age > ${18}`
const where2 = frogment`status = ${'active'}`
const whereClause = frogment.join([where1, where2], ' AND ')

const query = frogment`
  SELECT * FROM users
  WHERE ${whereClause}
`

console.log(frogment.dump(query))
// Output: SELECT * FROM users WHERE age > 18 AND status = active
```

At first glance, this looks like simple string interpolation. But in reality, Frogment preserves the tagged template literal structure internally. It merges fragments, keeps interpolation boundaries intact, and produces a single large tagged template literal. This enables safe and flexible downstream processing or SQL parameterization.

---
## 📖 Deep dive: Why Frogment is different
Normal string interpolation produces a final string, losing the template literal's structural metadata.

Frogment preserves this structure, enabling:

- Safe parameterization
- Recursive composition
- Deferred dumping or transformation

This means you can build highly dynamic, modular, and composable templates without the usual pitfalls of string building.



## Features

- Create fragments from strings, nested fragments, or a mix of both
- Join multiple fragments with custom delimiters (supports nested joins)
- Flatten deeply nested fragments seamlessly
- Supports all interpolation types (numbers, strings, booleans, null, undefined, objects)
- Dump the final fragment into a pure string with interpolations applied
- Works beyond SQL—suitable for any tagged template literal composition

---

## 🧪 API

`frogment(strings: TemplateStringsArray | string, ...values: any[])`

Creates a fragment from tagged template literal or string arguments.

`frogment.join(fragments: Array<Fragment | string>, delimiter: string): Fragment`

Joins an array of fragments or strings with a delimiter, flattening nested structures.

`frogment.dump(fragment: Fragment | string): string`

Dumps the fragment into a final plain string, applying all interpolations.

---
### Auto-Join Behavior
#### Auto-join inside template interpolation (without delimiter)

If you interpolate an array of fragments directly inside a `fragment``...``` template, and no delimiter is provided, they are joined without any delimiter:
```ts
const cond1 = fragment`age > ${18} AND `
const cond2 = fragment`status = ${'active'}`
const query = fragment`WHERE ${[cond1, cond2]}` 
//Result is equal to fragment`WHERE age > ${18} AND status ${'active'}

fragment.dump(query)
// → "WHERE age > 18 AND status = active"
```

## Advanced Join Use Cases

```js
import frogment from 'frogment'

// Joining conditions with different delimiters
const cond1 = frogment`price > ${100}`
const cond2 = frogment`stock > ${0}`
const cond3 = frogment`category = ${'electronics'}`

// Join with AND
const andClause = frogment.join([cond1, cond2, cond3], ' AND ')
// Result: "price > 100 AND stock > 0 AND category = electronics"

// Join with OR
const orClause = frogment.join([cond1, cond2, cond3], ' OR ')
// Result: "price > 100 OR stock > 0 OR category = electronics"

// Join with no delimiter (concatenate)
const concatClause = frogment.join([cond1, cond2, cond3])
// Result: "price > 100stock > 0category = electronics"

// Join nested fragments with mixed delimiters
const innerJoin = frogment.join([cond1, cond2], ' AND ')
const outerJoin = frogment.join([innerJoin, cond3], ' OR ')
// Result: "(price > 100 AND stock > 0) OR category = electronics"
```

---

## 💡 For Experienced Users

If you’re familiar with tagged template literals and need fine-grained control over template composition, Frogment offers:

- Very understandable syntax.
- Deep flattening of arbitrarily nested fragments without losing interpolation boundaries
- Efficient joining strategies to avoid unnecessary string concatenations
- Support for raw strings mixed with fragments seamlessly
- Ability to dump fragments both from `frogment` instances and raw template literals
- Useful for building SQL query builders, GraphQL queries, or other DSLs that rely on tagged templates

To see more examples, check out the [tests](./test/frogment.test.ts).

### 🧩 How does it work?

Each fragment is an object holding two key things:

- strings: the template strings array (e.g. ["age > ", ""])
- values: the interpolated expressions (e.g. [18])

When you compose fragments, Frogment:

- Merges the strings arrays by interleaving the fragments,
- Concatenates values in the correct order,
- Flattens nested fragments recursively.

So, this:

```js
frogment`${frogment`a = ${1}`} AND ${frogment`b = ${2}`}`
```

Results in the same structure as:

```js
frogment`a = ${1} AND b = ${2}`
```
But with all placeholders preserved, ready for safe dumping or further manipulation.


This is crucial to:

- Maintain the integrity of the template literal, so dumping or further processing outputs exactly what the composed template means, not just a concatenated string
- Avoid losing track of interpolation points which can cause SQL injection or other injection risks if improperly concatenated

⚠️ Important: Why normal string concatenation fails here
Consider native concatenation:

```js
const cond1 = `price > ${100}`
const cond2 = `stock > ${0}`
const cond3 = `category = ${'electronics'}`

const query = `WHERE ${cond1} AND ${cond2} AND ${cond3}`
```
Here, the actual values 100, 0, and 'electronics' are concatenated as strings, not as interpolated values. This means:

- The final string is `WHERE price > 100 AND stock > 0 AND category = electronics`
- The interpolation points are lost, you lose their placeholder nature. Values are already interpolated.
- This is not safe, because if you try to use this query in a real database, it probably will fail or cause a SQL injection vulnerability.

Frogment’s fragments keep them separate until explicitly dumped, allowing:
- Parameterized query generation
- Safer code generation patterns
- Deferred serialization
- Output is always another fragment, not a string.

### 💡 Use cases

- SQL query builders — safe and composable queries without string injection risks
- GraphQL templating — dynamic queries with fragments and variables
- Code generation — modular, nested template assembly
- Logging & formatting — controlled string assembly preserving placeholders
- Any scenario that benefits from tagged template literal composition.


#### Example: Deeply Nested Fragments

```js
const condA = frogment`a = ${1}`
const condB = frogment`b = ${2}`
const nested = frogment`${condA} AND ${condB}`

const condC = frogment`c = ${3}`
const complex = frogment`${nested} OR ${condC}`

const finalQuery = frogment`WHERE ${complex} AND d = ${4}`

console.log(frogment.dump(finalQuery))
// Outputs: WHERE a = 1 AND b = 2 OR c = 3 AND d = 4
```

#### Advanced use: Creating custom fragment combinators
You can build your own combinators on top of Frogment’s primitives to implement domain-specific template builders. For example: 

```js
function where(conditions: Array<Fragment | string>): Fragment {
  const filtered = conditions.filter(Boolean)
  if (filtered.length === 0) return frogment``
  return frogment`WHERE ${frogment.join(filtered, ' AND ')}`
}
```

#### Advanced use: Custom dumpers
In some cases, the values you interpolate inside your template might be complex objects rather than simple primitives. While your target system or library may accept these objects directly, they usually cannot be automatically converted to meaningful strings when you want to generate a raw textual representation. Therefore, you need to provide a custom way to convert (or "dump") these complex values into strings.

```js
import frogment, { Stringify } from 'frogment'
const dumpValue: Stringify = (param) => {
  if (typeof param === 'object' && param !== null && "value" in param) {
    return "'" + param.value + "'"
  }
  return String(param)
}

const { dump, dumpLog } = frogment.createDump(dumpValue)
const user = {
  value: 'John Doe',
}
const query = frogment`SELECT * FROM users WHERE ${user}`
dump(query) // "SELECT * FROM users WHERE 'John Doe'"
```
This pattern lets you define how to convert complex objects or custom types to strings, making frogment extremely flexible for advanced templating or query building use cases.

## 🙌 Contributing

PRs, issues, ideas welcome! Let's make Frogment the go-to tool for template literal composition.



## 📜 License

MIT License