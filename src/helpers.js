/**
 * 应该能更好比如串联
 * https://cn.vuejs.org/v2/guide/events.html#%E4%BA%8B%E4%BB%B6%E4%BF%AE%E9%A5%B0%E7%AC%A6
 */


// event to value a
const eva = e => e.target.value;

eva.stop = (e) => {
  e.stopPropagation();
  return eva(e);
};

eva.prevent = (e) => {
  e.preventDefault();
  return eva(e);
};

// 类型判断 (object, type) => bool
const isType = (o, t) => Object.prototype.toString.call(o) === `[object ${t}]`;

export {
  eva,
  isType,
};
