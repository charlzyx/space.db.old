![space.db](./logo.png)

# A Space/DataBinding Odyssey.

```js
/**
 * overview
 * ------------------------------------------------------------
 *
 * - SpaceProvider
 *   - chidren: element
 * ------------------------------------------------------------
 *
 * #private
 * - Space
 *   - space: privateId
 *   - value: Object | Array
 *   - onChange: Function
 * ------------------------------------------------------------
 *
 * - discover
 * () => [ got, put, Space ]
 *  - got() => store;
 *  - got.next() => Promise<store>
 *  - got.next(cb); cb(store)
 *  - put(differ) => void
 *  - Space: (props) => <Space {...props} space={privateId++} >
 * -----------------------------------------------------------
 *
 * - Atom
 *   - v: string | array
 *   - vm: string | array
 *   - got: true | string | function | [string, function]
 *   - put: true | string | function | [string, function]
 *   - children: element | function
 *   - render: function
 * ------------------------------------------------------------
 *
 * - Atomic
 *  (Comp) => AtomBox
 *   - AtomBox
 *     - v: string | array
 *     - vm: string | array
 *     - got: true | string | function | [string, function]
 *     - put: true | string | function | [string, function]*
 *
 * ------------------------------------------------------------
 */
```
