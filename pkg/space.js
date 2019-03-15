/* eslint-disable react/prop-types,no-param-reassign */
/**
 * Space/DataBinding
 */
import React, { createContext, Component, useState } from 'react';
import _ from 'lodash';
import produce from 'immer';

// utils
const isThenable = p => typeof p.then === 'function';

/**
 * TODO:
 * - Path Resolver: ./../../ and / support
 */
const pathResolve = (space, field) => {
  const shouldDot = !!space;
  return shouldDot ? `${space || ''}.${field || ''}` : field || '';
};


// const withoutThenable = v => (isThenable(v) ? v : undefined);

const SpaceCtx = createContext({});

const SpaceProvider = (props) => {
  const [store, change] = useState({
    // 异步表
    __awaiting_map: {
      // [path]: ['pending' | null, Error | null] | null
    },
  });

  const ctx = {
    space: null,
    store,
    change: (next) => {
      console.debug('[Space next]\n', next);
      change(next);
    },
  };

  return (
    <SpaceCtx.Provider value={ctx}>
      {props.children}
    </SpaceCtx.Provider>
  );
};

class Space extends Component {
  renderSpace = (ctx) => {
    // TODO: init check and Map Consider how to reset
    const { space: nowSpace, children, init } = this.props;
    const { space: parentSpace, store, change } = ctx;

    const space = pathResolve(parentSpace, nowSpace);

    const shouldInit = init && _.get(store, space) === undefined;

    const nextCtx = { ...ctx, space };

    if (shouldInit) {
      nextCtx.store = produce(store, (draft) => {
        _.set(draft, space, init);
      });
      change(nextCtx.store);
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

class Ship extends Component {
  renderShip = (ctx) => {
    const {
      space, store, change,
    } = ctx;

    const { children, field, await: awaiting } = this.props;
    if (!children) {
      console.warn('[space/Ship] should have an children');
      return null;
    }

    let onChange;
    const awaitingPath = pathResolve(space, typeof awaiting === 'string' ? awaiting : field);
    const path = pathResolve(space, field);
    // await: string | bool
    if (awaiting) {
      onChange = (next) => {
        if (isThenable(next)) {
          // update await map
          change(produce(store, (draft) => {
            draft.__awaiting_map[awaitingPath] = ['pending'];
          }));

          // then
          next.then((awaitNext) => {
            change(produce(store, (draft) => {
              _.set(draft, awaitingPath, awaitNext);
              draft.__awaiting_map[awaitingPath] = [];
            }));
          }).catch((e) => {
            change(produce(store, (draft) => {
              draft.__awaiting_map[awaitingPath] = [null, e];
            }));
          });
        } else { // sync
          change(produce(store, (draft) => {
            _.set(draft, awaitingPath, next);
          }));
        }
      };
    } else { // sync
      onChange = (next) => {
        change(produce(store, (draft) => {
          _.set(draft, path, next);
        }));
      };
    }

    const myAwaiting = store.__awaiting_map[path] || [];

    const childProps = {
      ...children.props,
      value: _.get(store, path),
      onChange,
      awaiting: [...myAwaiting],
    };

    if (path === 'earth.moons') {
      console.log('earth.moons', childProps);
    }

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
};
