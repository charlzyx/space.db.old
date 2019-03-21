/* eslint-disable react/prop-types */
/**
 * ------------------------------------------------------------
 * api 概览
 * ------------------------------------------------------------
 * - SpaceProvider
 *
 * - Space
 *   1. space Symbol(comp) | namespace
 *   2. init Object | Array
 *   3. live
 *   4. kill
 *
 * - Atom
 *   1. v
 *   2. vm
 *   3. pull true | string | selector | [string, selector]
 *   4. push true | string | filter | [string, filter]
 *
 * - action
 *   (namespace, actions) => void;
 *
 * - useSpace
 *   (namespace) => [data, put, actions]
 *
 */

import React, {
  //  forwardRef,
  createContext,
  PureComponent,
} from 'react';
// import PropTypes from 'prop-types';
// import hoistNonReactStatics from 'hoist-non-react-statics';
import _ from 'lodash';
import _castPath from 'lodash/_castPath';
import { useImmer } from 'use-immer';
import {
  setAutoFreeze,
  isDraft,
  isDraftable,
  // original,
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
 * ------------------------------------------------------------
 * The bridge, in space named wormhole
 * ------------------------------------------------------------
 */
const wormhole = {
  store: null,
  put: null,
  actions: null,
  puts: null,
};

const action = (namespace, differ) => {
  const { actions, put, store } = wormhole;
  const spaceStore = _.get(namespace, store);
  // FIXME:
  actions[namespace] = put(spaceStore, differ);
};

const useSpace = (namespace) => {
  const { store, puts, actions } = wormhole;
  return [store, puts, actions].map(i => _.get(i, namespace));
};

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


/**
 * ------------------------------------------------------------
 * Space
 * ------------------------------------------------------------
 */
class Space extends PureComponent {
  componentWillUnmount() {
    // TODO: alive | kill | auto
  }

  renderSpace = (ctx) => {
    const {
      space, children, init,
    } = this.props;
    const { store, put } = ctx;

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
    case pull === undefined:
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
    case push === undefined:
      return [];
    default:
      throw new Error('[Atom] unsupport [push] param type');
  }
};

const getDraft = v => (isDraft(v)
  ? v
  : isDraftable(v)
    ? createDraft(v)
    : v);

/**
 * ------------------------------------------------------------
 * Atom
 * ------------------------------------------------------------
 */

class Atom extends PureComponent {
  renderAtom = (ctx) => {
    const {
      v, vm, pull, push, children,
    } = this.props;
    const { space, store, put } = ctx;
    if (!v && v !== 0) throw new Error('[Atom] must have a [v] prop.');
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
    const draftV = getDraft(value);

    let onChange;

    if (push) {
      onChange = (cv) => {
        put((ctxDraft) => {
          /**
           * 同样的, pushFilter 在对象结构上不需要返回值, 但对于简单值这种类型, 返回了处理
           * pushFilter: (nextValueOrEvent | oldDraftValue | currentSpaceDraft) => next;
           */
          const next = pushFilter(cv, draftV, getDraft(_.get(ctxDraft, space)));
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

    if (push) {
      childrenProps[pushEventName] = onChange;
    }

    if (isType(children, 'Function')) {
      return children(childrenProps);
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


export {
  SpaceProvider,
  Space,
  Atom,
  action,
  useSpace,
};
