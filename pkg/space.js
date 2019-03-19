/* eslint-disable react/prop-types,no-param-reassign */
/**
 * Space/DataBinding
 */
import React, { createContext, Component } from 'react';
import _ from 'lodash';
import { useImmer } from 'use-immer';
import produce, {
  createDraft,
  isDraft,
  isDraftable,
  // original,
  // finishDraft,
} from 'immer';


/**
 * -----------------------------------------------------
 * Helpers for Space
 * -----------------------------------------------------
 */
// const isThenable = p => typeof p.then === 'function';

/**
 */
const pathResolve = (space, field) => {
  const shouldDot = space && field && (field[0] !== '[');
  return shouldDot ? `${space || ''}.${field || ''}` : `${space || ''}${field || ''}`;
};

// const findAwaiting = (path, map) => {
//   const foundKey = Object.keys(map).find(key => path.indexOf(key) > -1);
//   return map[foundKey] || [];
// };

const isType = (o, t) => Object.prototype.toString.call(o) === `[object ${t}]`;

/**
 * -----------------------------------------------------
 * Core Context
 * -----------------------------------------------------
 */
const SpaceCtx = createContext({});

/**
 * -----------------------------------------------------
 * just cache bridge for hole, privated by closure.
 * -----------------------------------------------------
 */
const wormhole = {
  store: null,
  put: () => {
    throw new Error('[space.db/wormhole] error, you should not seen this message.');
  },
};

/**
 * -----------------------------------------------------
 * getter and setter to export
 * @function pull(space, ...fields) => any
 * @type what notFunction | funcAsProducer
 * @function put(space, field) => putWhat
 * @function put(space, field, what) => next
 * -----------------------------------------------------
 */
const hole = {
  pull: (space, ...fields) => {
    const path = pathResolve(space, fields.reduce((last, field) => pathResolve(last, field), ''));
    return path ? _.get(wormhole.store, path) : wormhole.store;
  },
  /**
   * absoulte space
   * @param space
   * @param maybeWhat
   * @returns {(function(*=): (*|void))|*|void}
   */
  put: (space, ...maybeWhat) => {
    const path = pathResolve(space);
    if (maybeWhat.length === 1) {
      // will be undefine always
      return wormhole.put((draft) => {
        const what = maybeWhat[0];
        const next = typeof what === 'function'
          ? what(_.get(draft, path))
          : what;
        _.set(draft, path, next);
      });
    }
    const putWhat = w => wormhole.put((draft) => {
      const next = typeof w === 'function'
        ? w(_.get(draft, path))
        : w;
      _.set(draft, path, next);
    });
    return putWhat;
  },
};

// protected out side change
Object.freeze(hole);

/**
 * -----------------------------------------------------
 * core provider, provider store and put
 * -----------------------------------------------------
 */
const SpaceProvider = (props) => {
  const [store, put] = useImmer({
    // 异步表
    __awaiting_map: {
      // [path]: ['pending' | null, Error | null] | null
    },
  });

  wormhole.store = store;
  wormhole.put = put;

  const ctx = {
    space: null,
    store,
    put,
  };

  return (
    <SpaceCtx.Provider value={ctx}>
      {props.children}
    </SpaceCtx.Provider>
  );
};

/**
 * -----------------------------------------------------
 * MOST INTERESTING! CORE IDEA!
 * manager for space name and init
 * @props space unique string to namespaced module
 * @props init the init value for this space
 * @props alive keep alive when unmount
 * @props kill force kill when unmount
 *
 * here is the core code.
 * <Ctx.Consumer>
 *   <Ctx.Provider>
 *   </Ctx.Provider>
 * </Ctx.Consumer>
 * -----------------------------------------------------
 */

const spaceResolver = (parentSpace, nowSpace) => {
  if (nowSpace[0] === '/') {
    return nowSpace.slice(0, 1);
  }
  return `${parentSpace || ''}${parentSpace ? '.' : ''}${nowSpace}`;
};

const findParentSpace = (absoluteSpace, namespaces) => Object.keys(namespaces)
  .find(sp => absoluteSpace.indexOf(sp) > -1
      && (absoluteSpace.indexOf(`${sp}.`) > -1 || absoluteSpace.indexOf(`${sp}[` > -1)));

class Space extends Component {
  static namespaces = {};

  // this space killer
  thisSpaceKiller = false;

  // the absolute space
  absoluteSpace = '';

  componentWillUnmount() {
    const { namespaces } = Space;
    const { alive, kill } = this.props;
    const { absoluteSpace } = this;

    const parentSpace = findParentSpace(absoluteSpace, namespaces);
    namespaces[absoluteSpace].ins = (namespaces[absoluteSpace] && namespaces[absoluteSpace].ins)
      ? namespaces[absoluteSpace].ins - 1 : 0;


    if (parentSpace) {
      const parent = namespaces[parentSpace];
      parent.children = parent.children ? parent.children - 1 : 0;
    }

    switch (true) {
      case kill:
        this.thisSpaceKiller();
        break;
      case alive:
        break;
      default:
        if (namespaces[absoluteSpace].ins <= 0 && !namespaces[absoluteSpace].children <= 0) {
          this.thisSpaceKiller();
        }
    }
  }

  // registry in namespaces
  namespaced() {
    const { namespaces } = Space;
    const { absoluteSpace } = this;

    const parentSpace = findParentSpace(absoluteSpace, namespaces);
    if (!namespaces[absoluteSpace]) {
      namespaces[absoluteSpace] = { ins: 1, children: 0 };
    } else {
      namespaces[absoluteSpace].ins ++; // eslint-disable-line
    }


    if (parentSpace) {
      const parent = namespaces[parentSpace];
      parent.children = parent.children ? parent.children + 1 : 1;
    }
  }


  renderSpace = (ctx) => {
    const {
      space: nowSpace, children, init, put: putBind,
    } = this.props;
    const { space: parentSpace, store, put } = ctx;

    const space = spaceResolver(parentSpace, nowSpace);

    if (!this.absoluteSpace) {
      this.absoluteSpace = space;
      this.namespaced();
    }

    if (this.thisSpaceKiller === false) {
      this.thisSpaceKiller = () => put((draft) => {
        _.set(draft, space, null);
      });
    }


    // TODO: warning, should more simple
    const [bindCtx, path] = putBind;
    if (putBind && !_.get(bindCtx, path)) {
      _.set(bindCtx, path, (producer) => {
        put((draft) => {
          console.log('draft', draft, space);
          producer(_.get(draft, space), init);
        });
      });
    }

    const shouldInit = init && _.get(store, space) === undefined;

    const nextCtx = { ...ctx, space };

    if (shouldInit) {
      // _.set to make first render has init value
      _.set(nextCtx, `store.${space}`, init);
      put((draft) => {
        _.set(draft, space, init);
      });
    }

    return (
      <SpaceCtx.Provider value={nextCtx}>
        {children}
      </SpaceCtx.Provider>
    );
  };

  render() {
    return (
      <SpaceCtx.Consumer>
        {this.renderSpace}
      </SpaceCtx.Consumer>
    );
  }
}


/**
 * -----------------------------------------------------
 * data binding core
 * TODO: Pull
 * pull: string | filter | [string, filter]
 * push: undefined | string | [string, filter]
 * -----------------------------------------------------
 */

const pass = v => v;
const handlePull = (pull) => {
  switch (true) {
    case isType(pull, 'Array'):
      return [pull[0] || 'value', pull[1] || pass];
    case isType(pull, 'String'):
      return [pull || 'value', pass];
    case isType(pull, 'Function'):
      return ['value', pull];
    default:
      return ['value', pass];
  }
};

const handlePush = (push) => {
  switch (true) {
    case isType(push, 'Array'):
      return [push[0] || 'onChange', push[1] || pass];
    case isType(push, 'String'):
      return [push || 'onChange', pass];
    case isType(push, 'Function'):
      return ['onChange', push];
    default:
      return ['onChange', pass];
  }
};

const handleComputed = (computed) => {
  switch (true) {
    case isType(computed, 'Array'):
      return [computed[0] || pass, computed[1] || pass];
    case isType(computed, 'Function'):
      return [computed, pass];
    default:
      return [pass, pass];
  }
};

class Pull extends Component {
  renderPull = (ctx) => {
    const { space, store, put } = ctx;
    const {
      bind,
      pull,
      push,
      computed,
      children,
    } = this.props;

    const path = bind ? pathResolve(space, bind) : space;
    const [pullPath, pullFilter] = handlePull(pull);
    const [pushMethodName, pushFilter] = handlePush(push);
    const [getter, setter] = handleComputed(computed);

    const v = pullFilter(computed && !bind ? getter(_.get(store, space)) : _.get(store, path));

    const onChange = (cv) => {
      if (computed) {
        const next = pushFilter(produce(v, setter));
        put((draft) => {
          _.set(draft, path, next);
        });
      } else {
        // const next = isDraft(cv) ? finishDraft(cv) : cv;
        const next = pushFilter(cv);
        put((draft) => {
          _.set(draft, path, next);
        });
      }
    };

    const draft = isDraft(v) ? v : (isDraftable(v) ? createDraft(v) : v);

    const childProps = {
      ...children.props,
      [pullPath]: draft,
    };
    if (bind || setter !== pass) {
      childProps[pushMethodName] = onChange;
    }

    return React.cloneElement(children, childProps);
  }

  render() {
    return (
      <SpaceCtx.Consumer>
        {this.renderPull}
      </SpaceCtx.Consumer>
    );
  }
}

export {
  SpaceProvider,
  Space,
  Pull,
  hole,
};
