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

import React, {
  forwardRef,
  createContext,
  PureComponent,
} from 'react';
import PropTypes from 'prop-types';
import hoistNonReactStatics from 'hoist-non-react-statics';
import _ from 'lodash';
import _castPath from 'lodash/_castPath';
import { useImmer } from 'use-immer';
import {
  setAutoFreeze,
  isDraft,
  isDraftable,
  original,
  createDraft,
  finishDraft,
} from 'immer';

setAutoFreeze(true);


/**
 * ------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------
 */


const isType = (o, t) => Object.prototype.toString.call(o) === `[object ${t}]`;

/**
 * ------------------------------------------------------------
 * The Context
 * ------------------------------------------------------------
 */

const SpaceCtx = createContext({});

/**
 * wormhole
 * ------------------------------------------------------------
 * privated bridge, in space named wormhole
 * ------------------------------------------------------------
 */
const wormhole = {
  store: {},
  put: {},
  puts: {},
};

/**
 * dicover
 * ------------------------------------------------------------
 * (space) => { data, put }
 * ------------------------------------------------------------
 * The Salute To Discovery
 */
const discover = (space) => {
  const spacePair = {};
  Object.defineProperty(spacePair, 'data', {
    get() { return _.get(wormhole, ['store', space]); },
  });
  Object.defineProperty(spacePair, 'put', {
    get() { return _.get(wormhole, ['puts', space]); },
  });
  return spacePair;
};

/**
 * SpaceProvider
 * ------------------------------------------------------------
 * children: element
 * ------------------------------------------------------------
 */
const SpaceProvider = (props) => {
  const [store, put] = useImmer({});
  const ctx = {
    store,
    put,
  };
  wormhole.store = store;
  wormhole.put = put;
  const { children } = props;
  return (
    <SpaceCtx.Provider value={ctx}>
      {children}
    </SpaceCtx.Provider>
  );
};

SpaceProvider.propTypes = {
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
};

SpaceProvider.defaultProps = {
  children: null,
};


/**
 * Space
 * ------------------------------------------------------------
 * - space: string | Symbol
 * - init: Object
 * - alive: TODO
 * - kill: TODO
 * ------------------------------------------------------------
 */
class Space extends PureComponent {
  static propTypes = {
    children: PropTypes.node,
    space: PropTypes.oneOf([PropTypes.string, PropTypes.instanceOf(Symbol)]),
    init: PropTypes.object, // eslint-disable-line
  };

  static defaultProps = {
    children: null,
    space: null,
    init: null,
  };

  componentWillUnmount() {
    // TODO: alive | kill | auto
  }

  renderSpace = (ctx) => {
    const {
      space, children, init,
    } = this.props;
    const { store, put } = ctx;
    if (!space) throw new Error('[Space] must has an space');

    const shouldInit = init && _.get(store, space) === undefined;

    const nextCtx = { ...ctx, space };

    /**
     * --------------------------------------------------------
     * spacePut 没有透传下去是为了 Atom 里面更加灵活, 比如:
     * path可以使用 '/' 指向 space
     * --------------------------------------------------------
     */
    const spacePut = (differ) => {
      put((ctxDraft) => {
        const spaceStore = _.get(ctxDraft, [space]);
        const maybeNext = differ(spaceStore);
        // 并不期望有返回值, 跟 immer 是一样的, 但是如果真的返回了,
        // 还是要处理
        if (maybeNext !== undefined) {
          _.set(ctxDraft, [space], maybeNext);
        }
      });
    };

    /**
     * --------------------------------------------------------
     * export put for this space
     * --------------------------------------------------------
     */
    wormhole.puts[space] = spacePut;

    if (shouldInit) {
      /**
       * --------------------------------------------------------
       * 这个 set 是为了保证, 在子组件第一次渲染的时候
       * 就能拿到自己设置的初始值
       * --------------------------------------------------------
       */
      _.set(nextCtx, ['store', space], init);
      put((ctxDraft) => {
        _.set(ctxDraft, [space], init);
      });
    }

    /**
     * --------------------------------------------------------
     * 这个 SpaceCtx.Provider 就是整个 Atom 双向绑定的精髓了
     * --------------------------------------------------------
     */
    return (
      <SpaceCtx.Provider value={nextCtx}>
        {children}
      </SpaceCtx.Provider>
    );
  }

  render() {
    return (
      <SpaceCtx.Consumer>
        {this.renderSpace}
      </SpaceCtx.Consumer>
    );
  }
}

/**
 * ------------------------------------------------------------
 * Atom Helpers
 * ------------------------------------------------------------
 */

const pass = v => v;

const handlePull = (pull, vm) => {
  switch (true) {
    case isType(pull, 'Array'):
      return [pull[0] || 'value', pull[1] || pass];
    case isType(pull, 'String'):
      return [pull || 'value', pass];
    case isType(pull, 'Function'):
      return ['value', pull];
    case pull:
      return ['value', pass];
    // 快捷方式, vm="path" === v="path" pull
    case !!vm:
      return ['value', pass];
    // 主要是为了防止下方结构报错
    case pull === undefined || pull === null:
      return [];
    default:
      throw new Error('[Atom] unsupport [pull] param type');
  }
};

const handlePush = (push, vm) => {
  switch (true) {
    case isType(push, 'Array'):
      return [push[0] || 'onChange', push[1] || pass];
    case isType(push, 'String'):
      return [push || 'onChange', pass];
    case isType(push, 'Function'):
      return ['onChange', push];
    case push:
      return ['onChange', pass];
    // 快捷方式, vm="path" === v="path" pull
    case !!vm:
      return ['onChange', pass];
    // 主要是为了防止下方结构报错
    case push === undefined || push === null:
      return [];
    default:
      throw new Error('[Atom] unsupport [push] param type');
  }
};

const draftify = v => (isDraft(v)
  ? v
  : isDraftable(v)
    ? createDraft(v)
    : v);

/**
 * Atom
 * ------------------------------------------------------------
 * - v: string | array
 * - vm: string | array
 * - pull: true | string | function | [string, function]
 * - push: true | string | function | [string, function]
 * - children: element | function
 * - render: function
 * ------------------------------------------------------------
 */

class Atom extends PureComponent {
  static propTypes = {
    v: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
    vm: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
    pull: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.func,
      PropTypes.arrayOf([PropTypes.string, PropTypes.func]),
    ]),
    push: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.func,
      PropTypes.arrayOf([PropTypes.string, PropTypes.func]),
    ]),
    children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    render: PropTypes.func,
  };

  static defaultProps = {
    v: null,
    vm: null,
    pull: null,
    push: null,
    children: null,
    render: null,
  }

  renderAtom = (ctx) => {
    const {
      v, vm, pull, push, children, render,
    } = this.props;
    const { space, store, put } = ctx;
    if (!v && v !== 0 && !vm && vm !== 0) throw new Error('[Atom] must have a [v] prop.');
    if (v && vm) throw new Error('[Atom] [v] and [vm] 属性 不能共存.');
    const bind = v || vm;
    /**
     * ------------------------------------------------------------
     * 将 path 解析成数组, 添加 v="/" 语法糖
     * ------------------------------------------------------------
     */
    const path = bind === '/' ? [space] : [space, ..._castPath(bind)];

    const [pullPath, pullSelector] = handlePull(pull, vm);
    const [pushEventName, pushFilter] = handlePush(push, vm);

    // 获取对应对应的值
    const value = pullSelector(_.get(store, path), _.get(store, space));
    // 草稿化
    const draftV = draftify(value);

    let onChange;

    if (push || vm) {
      onChange = (cv) => {
        /**
         * pushFilter: (nextValueOrEvent | oldDraftValue | currentSpaceDraft) => next;
         * 受限于 [SyntheticEvent](https://reactjs.org/docs/events.html) 限制,
         *  SyntheticEvent 不能够异步调用
         * 因此不同于 put, 必须要返回一个值, 不过, 第二个参数 olgValue, 第三个参数 currentSpaceData
         * 都被包装成了 draft 所以也可以通过简单的对象修改再 return 出来即可
         */
        const next = pushFilter(cv, draftV, draftify(_.get(store, space)));

        put((ctxDraft) => {
          if (next) {
            const n = isDraft(next) ? finishDraft(next) : next;
            _.set(ctxDraft, path, n);
          }
        });
      };
    }

    const childrenProps = {
      ...children.props,
      [pullPath]: draftV,
    };

    if (push || vm) {
      childrenProps[pushEventName] = onChange;
    }

    // Render Props support
    if (isType(children, 'Function')) {
      return children(childrenProps);
    }

    if (isType(render, 'Function')) {
      return render(childrenProps);
    }

    return React.cloneElement(children, childrenProps);
  }

  render() {
    return (
      <SpaceCtx.Consumer>
        {this.renderAtom}
      </SpaceCtx.Consumer>
    );
  }
}

/**
 * Atomic
 * ------------------------------------------------------------
 * (Comp) => AtomBox
 * - AtomBox
 *   - v: string | array
 *   - vm: string | array
 *   - pull: true | string | function | [string, function]
 *   - push: true | string | function | [string, function]
 * ------------------------------------------------------------
 */

const Atomic = (Comp) => {
  class AtomBox extends PureComponent {
    static displayName = `AtomBoxed${Comp.displayName || Comp.name || ''}`;

    static propTypes = {
      forwardRef: PropTypes.oneOfType([
        PropTypes.func,
        // Element is just window.Element, this type for React.createRef()
        PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
      ]),
      v: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
      vm: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
      pull: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.func,
        PropTypes.arrayOf([PropTypes.string, PropTypes.func]),
      ]),
      push: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.func,
        PropTypes.arrayOf([PropTypes.string, PropTypes.func]),
      ]),
    };

    static defaultProps = {
      forwardRef: null,
      v: null,
      vm: null,
      pull: null,
      push: null,
    }

    renderAtom = (ctx) => {
      const {
        v, vm, pull, push,
      } = this.props;
      const { space, store, put } = ctx;
      if (!v && v !== 0 && !vm && vm !== 0) throw new Error('[Atom] must have a [v] prop.');
      if (v && vm) throw new Error('[Atom] [v] and [vm] 属性 不能共存.');
      const bind = v || vm;
      /**
     * ------------------------------------------------------------
     * 将 path 解析成数组, 添加 v="/" 语法糖
     * ------------------------------------------------------------
     */
      const path = bind === '/' ? [space] : [space, ..._castPath(bind)];

      const [pullPath, pullSelector] = handlePull(pull, vm);
      const [pushEventName, pushFilter] = handlePush(push, vm);

      // 获取对应对应的值
      const value = pullSelector(_.get(store, path), _.get(store, space));
      // 草稿化
      const draftV = draftify(value);

      let onChange;

      if (push) {
        onChange = (cv) => {
          if (typeof this.props[pushEventName] === 'function') {
            this.props[pushEventName](cv);
          }
          /**
           * pushFilter: (nextValueOrEvent | oldDraftValue | currentSpaceDraft) => next;
           * 受限于 [SyntheticEvent](https://reactjs.org/docs/events.html) 限制,
           *  SyntheticEvent 不能够异步调用
           * 因此不同于 put, 必须要返回一个值, 不过, 第二个参数 olgValue, 第三个参数 currentSpaceData
           * 都被包装成了 draft 所以也可以通过简单的对象修改再 return 出来即可
           */
          const next = pushFilter(cv, draftV, draftify(_.get(store, space)));

          put((ctxDraft) => {
            if (next) {
              const n = isDraft(next) ? finishDraft(next) : next;
              _.set(ctxDraft, path, n);
            }
          });
        };
      }

      const childrenProps = {
        ...this.props,
        [pullPath]: draftV,
      };

      if (push) {
        childrenProps[pushEventName] = onChange;
      }

      return <Comp {...childrenProps} />;
    }

    render() {
      return (
        <SpaceCtx.Consumer>
          {this.renderAtom}
        </SpaceCtx.Consumer>
      );
    }
  }

  hoistNonReactStatics(AtomBox, Comp);
  return forwardRef((props, ref) => <AtomBox {...props} forwardRef={ref} />);
};

const log = (o, msg) => {
  if (isDraft(o)) {
    console.log(msg);
    console.dir(original(o));
  } else {
    console.log(msg);
    console.dir(o);
  }
};


export {
  SpaceProvider,
  Space,
  Atom,
  Atomic,
  discover,
  log,
};
