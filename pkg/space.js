/* eslint-disable react/prop-types */
/**
 * overview
 * ------------------------------------------------------------
 *
 * - SpaceProvider
 *   - chidren: element
 * ------------------------------------------------------------
 * #private
 *
 * - Space
 *   - space: Symbol
 *   - init: Object | Array
 *   - onChange: Function
 * ------------------------------------------------------------
 *
 * - discover
 * () => [ got, put, Space ]
 * -----------------------------------------------------------
 *
 * - Atom
 *   - v: string | array
 *   - vm: string | array
 *   - got: bool | string | function | [string, function]
 *   - put: bool | string | function | [string, function]
 *   - children: element | function
 *   - render: function
 * ------------------------------------------------------------
 *
 * - Atomic
 *  (Comp) => AtomBox
 *   - AtomBox
 *     - v: string | array
 *     - vm: string | array
 *     - got: bool | string | function | [string, function]
 *     - put: bool | string | function | [string, function]
 *
 * ------------------------------------------------------------
 */

import React, {
  // forwardRef,
  createContext,
  PureComponent,
  useEffect,
  // useState,
} from 'react';
import PropTypes from 'prop-types';
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
  // finishDraft,
  // finishDraft,
} from 'immer';
import shallowequal from 'shallowequal';

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
 * _wormhole
 * ------------------------------------------------------------
 * privated bridge, in space named wormhole
 * ------------------------------------------------------------
 */
const _wormhole = {
  gots: {},
  puts: {},
  getGot(id) {
    return this.gots[id];
  },
  getPut(id) {
    return this.puts[id];
  },
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
  useEffect(() => {
    // console.log('use effect', store);
  });

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
 *   - debug: String
 *   - space: Symbol
 *   - value: Object | Array
 *   - onChange: Function
 * ------------------------------------------------------------
 */

const notify = (old, next, notice) => {
  if (notice !== undefined
    && old !== undefined
    && next !== undefined
    && !shallowequal(old, next)
  ) {
    notice(next);
    return true;
  }
  return false;
};

class Space extends PureComponent {
  _killer = null;

  init = undefined;

  reseter = null;

  lastStore = undefined;

  componentWillUnmount() {
    this._killer();
  }

  renderSpace = (ctx) => {
    const {
      space, children, init, onChange,
    } = this.props;
    const { store, put } = ctx;
    const spaceStore = _.get(store, space);

    notify(this.lastStore, spaceStore, onChange);
    this.lastStore = spaceStore;

    if (!spaceStore && init) {
      put((draftStore) => {
        _.set(draftStore, space, init);
      });
    }

    if (!this.init) {
      this.init = _.cloneDeep(init);
      this.reseter = () => put((draftStore) => {
        _.set(draftStore, space, _.cloneDeep(this.init));
      });
    }

    if (!this._killer) {
      this._killer = () => put((draftStore) => {
        _.set(draftStore, space, undefined);
      });
    }


    const spacePut = (differ) => {
      put((draftStore) => {
        differ(draftStore[space], this.reseter);
      });
    };

    _wormhole.gots[space] = spaceStore;
    _wormhole.puts[space] = spacePut;

    const nextCtx = {
      store: spaceStore,
      put: spacePut,
    };

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
 * dicover
 * ------------------------------------------------------------
 * (space) => [ data, put, Space ]
 * ------------------------------------------------------------
 * The Salute To Discovery
 */

let spaceId = 0;
const discover = (name) => {
  const id = `space_${spaceId++}`; // eslint-disable-line

  const NASA = props => <Space {...props} space={id} />;
  NASA.displayName = `${name || 'Unknown'}Space`;
  const got = () => _wormhole.getGot(id);
  const put = (differ, waiting = 0) => {
    _wormhole.getPut(id)(differ);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(got());
      }, waiting);
    });
  };
  got.next = (waiting = 0) => new Promise((resolve) => {
    setTimeout(() => {
      resolve(got());
    }, waiting);
  });

  return [got, put, NASA];
};

/**
 * ------------------------------------------------------------
 * Atom Helpers
 * ------------------------------------------------------------
 */

const pass = v => v;

const handleGot = (got) => {
  switch (true) {
    case isType(got, 'Array'):
      return [got[0] || 'value', got[1] || pass];
    case isType(got, 'String'):
      return [got || 'value', pass];
    case isType(got, 'Function'):
      return ['value', got];
    default:
      return ['value', pass];
  }
};

const handlePut = (put) => {
  switch (true) {
    case isType(put, 'Array'):
      return [put[0] || 'onChange', put[1] || pass];
    case isType(put, 'String'):
      return [put || 'onChange', pass];
    case isType(put, 'Function'):
      return ['onChange', put];
    default:
      return ['onChange', pass];
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
 * ------------------------------------------------------------
 */

class Atom extends PureComponent {
  renderAtom = (ctx) => {
    const {
      vm, got, put, render, children,
    } = this.props;
    const {
      store, put: spacePut,
    } = ctx;

    // 'x.y' | ['x', 'y'] => ['x', 'y'];
    const path = _castPath(vm);

    const [gotPath, gotSelector] = handleGot(got);
    const [putEventName, putChanger] = handlePut(put);

    const draftV = draftify(gotSelector(_.get(store, path)));


    const childProps = {
      ...children.props,
      [gotPath]: draftV,
    };

    if (put !== false) {
      const originPutEvent = childProps[putEventName];
      // 原来组件的onChange怎么处理呢怎么处理呢怎么处理呢怎么处理呢, 表单写一写再来决定吧
      childProps[putEventName] = (...args) => {
        let nextv = args[0];
        // 原来有方法, 就套一层
        if (isType(originPutEvent, 'Function')) {
          const eventResult = originPutEvent(...args);
          // 是否需要接受原来onChange的值, 待定, 可能需要加开关了
          if (eventResult !== undefined) {
            nextv = eventResult;
          }
        }
        const nextArgs = args.concat([draftV, store]);
        nextArgs.slice(1, nextv);
        const v = putChanger(nextArgs);
        spacePut(spaceDraft => _.set(spaceDraft, path, v));
      };
    }

    // Render Props support
    if (isType(children, 'Function')) {
      return children(childProps);
    }

    if (isType(render, 'Function')) {
      return render(childProps);
    }

    // clone support
    return React.cloneElement(children, childProps);
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
  Atom,
  discover,
};
