/* eslint-disable react/prop-types,no-param-reassign */
/**
 * Space/DataBinding
 */
import React, { createContext, Component } from 'react';
import _ from 'lodash';
import { useImmer } from 'use-immer';
import {
  createDraft, isDraft, isDraftable, finishDraft,
} from 'immer';


/**
 * -----------------------------------------------------
 * Helpers for Space
 * -----------------------------------------------------
 */
const isThenable = p => typeof p.then === 'function';

/**
 * TODO:
 * - Path Resolver: ./../../ and / support
 */
const pathResolve = (space, field) => {
  const shouldDot = space && field && (field[0] !== '[');
  return shouldDot ? `${space || ''}.${field || ''}` : `${space || ''}${field || ''}`;
};

const findAwaiting = (path, map) => {
  const foundKey = Object.keys(map).find(key => path.indexOf(key) > -1);
  return map[foundKey] || [];
};

/**
 * -----------------------------------------------------
 * Core Context
 * -----------------------------------------------------
 */
const SpaceCtx = createContext({});

/**
 * -----------------------------------------------------
 * just cache bridge for hole, private by closure.
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
    return _.get(wormhole.store, path);
  },
  put: (space, field, ...maybeWhat) => {
    const path = pathResolve(space, field);
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
 *
 * here is the core code.
 * <Ctx.Consumer>
 *   <Ctx.Provider>
 *   </Ctx.Provider>
 * </Ctx.Consumer>
 * -----------------------------------------------------
 */

// TODO: thinking about namespace and reset;
// TODO: thinking about life circle
// const namespace = { };
class Space extends Component {
  static spaces = {
    // [space]: {
    //   ins: number,
    //   children: []
    // },
  };

  componentWillMount() {
    const { space } = this.props;
    if (!Space.spaces[space]) {
      Space.spaces[space] = {
        ins: 1,
        children: [],
      };
    } else {
      Space.spaces[space].ins++; // eslint-disable-line
    }
  }

  componentWillUnmount() {
    const { space, alive } = this.props;
    Space.spaces[space].ins --; // eslint-disable-line
    // 没有实例了
    if (!Space.spaces[space].ins && !alive) {
      hole.put(space, '', (draft) => {
        _.set(draft, space, null);
      });
    }
  }

  renderSpace = (ctx) => {
    const { space, children, init } = this.props;
    const { store, put } = ctx;

    // const space = pathResolve(parentSpace, nowSpace);
    // if (namespace[space]) { }

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
 *
 * @props field: string
 * @props async: bool| string
 * @props computed: [[need], computer: () => {}]
 * -----------------------------------------------------
 */
class Ship extends Component {
  renderShip = (ctx) => {
    const {
      space, store, put,
    } = ctx;

    const {
      children, field, await: awaiting, computed,
    } = this.props;
    // TODO: props check
    if (!children) {
      console.warn('[space.db/Ship] should have an children');
      return null;
    }

    if (computed) {
      if (field) {
        console.warn('[space.db/Ship] [computed] can not use with [field],'
          + ' it will be ignored with this warning.');
      }
      if (awaiting) {
        console.warn('[space.db/Ship] [computed] can not use with [await],'
          + ' it will be ignored with this warning.');
      }
      const [wants, computer] = computed;
      let childProps = { ...children.props };
      try {
        const paths = wants.map(w => pathResolve(space, w));
        const value = computer(paths.map(p => _.get(store, p)));
        childProps = {
          ...children.props,
          value,
        };
      } catch (e) {
        childProps = {
          error: e,
        };
      }

      return React.cloneElement(children, childProps);
    }

    let onChange;
    const awaitingPath = pathResolve(space, typeof awaiting === 'string' ? awaiting : field);
    const path = pathResolve(space, field);
    // await: string | bool
    if (awaiting) {
      onChange = (v) => {
        const next = isDraft(v) ? finishDraft(v) : v;

        if (isThenable(next)) {
          // update awaiting map
          put((draft) => {
            draft.__awaiting_map[awaitingPath] = ['pending'];
          });

          // then
          next.then((awaitNext) => {
            put((draft) => {
              _.set(draft, awaitingPath, awaitNext);
              draft.__awaiting_map[awaitingPath] = [];
            });
          }).catch((e) => {
            put((draft) => {
              draft.__awaiting_map[awaitingPath] = [null, e];
            });
          });
        } else { // sync
          put((draft) => {
            _.set(draft, awaitingPath, next);
          });
        }
      };
    } else { // sync
      onChange = (v) => {
        const next = isDraft(v) ? finishDraft(v) : v;

        put((draft) => {
          _.set(draft, path, next);
        });
      };
    }

    const v = _.get(store, path);
    const childProps = {
      ...children.props,
      value: v,
      draft: isDraft(v) ? v : (isDraftable(v) ? createDraft(v) : v),
      onChange,
      awaiting: findAwaiting(path, store.__awaiting_map),
    };

    return React.cloneElement(children, childProps);
  };

  render() {
    return (
      <SpaceCtx.Consumer>
        {this.renderShip}
      </SpaceCtx.Consumer>
    );
  }
}

export {
  SpaceProvider,
  Space,
  Ship,
  hole as space,
};
