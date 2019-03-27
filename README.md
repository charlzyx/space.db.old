# MOVE TO [space.db](https://github.com/charlzyx/space.db)


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
 * - Space
 *   - space: string | Symbol
 *   - init: Object
 *   - alive: TODO
 *   - kill: TODO
 * ------------------------------------------------------------
 *
 * - Atom
 *   - v: string | array
 *   - vm: string | array
 *   - pull: true | string | function | [string, function]
 *   - push: true | string | function | [string, function]
 *   - children: element | function
 *   - render: function
 * ------------------------------------------------------------
 *
 * - Atomic
 *  (Comp) => AtomBox
 *   - AtomBox
 *     - v: string | array
 *     - vm: string | array
 *     - pull: true | string | function | [string, function]
 *     - push: true | string | function | [string, function]*
 *
 * ------------------------------------------------------------
 *
 * - discover
 *  (space) => { data, put }
 * ------------------------------------------------------------
 *
 * - log
 *  (maybeDraft, msg) => console.log
 * ------------------------------------------------------------
 *
 */
```
