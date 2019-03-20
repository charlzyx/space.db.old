/* eslint-disable */
/**
 * ------------------------------------------------------------
 * api 概览
 * ------------------------------------------------------------
 * - SpaceProvider
 * - Space
 *   1. space Symbol(comp) | path
 *   2. init Object
 *   3. live
 *   4. kill
 *   5. put insdiffer = differ
 * - Pull
 *   1. v
 *   2. vm
 *   3. pull string | selector | [string, selector]
 *   4. push string | filter | [string, filter]
 *   5. put todo
 * - hole
 *   1. store
 *   2. put
 */

import React, { createContext, PureComponent } from 'react';
import _ from 'lodash';
import { userImmer, useImmer } from 'use-immer';
import imput, {
  isDraft,
  isDraftable,
  original,
  createDraft,
  finishDraft,
} from 'immer';


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
 * SpaceProvider
 * ------------------------------------------------------------
 */

const SpaceProvider = (props) => {
  const [store, put] = useImmer({});
  const ctx = {
    space: '',
    store,
    put: (...args) => {
      put(...args);
      console.log('put:---------------------');
      try {
        console.log(`${JSON.stringify(store, null, 2)}`);
        console.log(store);
      } catch (error) {
        console.log(store);
      }
      console.log('---------------------put]');
    },
  };
  const { children } = props;
  return (
    <SpaceCtx.Provider value={ctx}>
      {children}
    </SpaceCtx.Provider>
  );
};

/**
 * ------------------------------------------------------------
 * Space Helpers
 * ------------------------------------------------------------
 */

const spaceResolve = (parent, now) => {
  if (isType(now, 'Symbol')) {
    return now;
  }
  if (now[0] === '/') {
    return now.slice(0, 1);
  }
  return Array.isArray(parent) ? parent.concat(now) : [parent, now];
};

/**
 * ------------------------------------------------------------
 * Space
 * ------------------------------------------------------------
 */
class Space extends PureComponent {

  renderSpace = (ctx) => {
    const { space: nowSpace, children, init, put: putBind } = this.props;
    const { space: parentSpace, store, put } = ctx;

    const space = spaceResolve(parentSpace, nowSpace);

    if (putBind) {
      putBind((differ) => {
        put((ctxDraft) => {
          differ(_.get(ctxDraft, space));
        });
      });
    }

    const shouldInit = init && _.get(store, space) === undefined;
    const nextCtx = { ...ctx, space };

    if (shouldInit) {
      _.set(nextCtx, ['store', space], init);
      put((ctxDraft) => {
        _.set(ctxDraft, space, init);
      });
    }

    return (
      <SpaceCtx.Provider value={nextCtx}>
       {children}
      </SpaceCtx.Provider>
    )

  }


  render() {
    return (
      <SpaceCtx.Consumer>
        {this.renderSpace}
      </SpaceCtx.Consumer>
    )
  }
}

/**
 * ------------------------------------------------------------
 * Atom Helpers
 * ------------------------------------------------------------
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
    case pull:
      return ['value', pass];
    default:
      throw new Error('[Atom] unsupport [pull] param type');
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
    case push:
      return ['onChange', pass];
    case isType(push, 'Undefined'):
      return [];
    default:
      throw new Error('[Atom] unsupport [push] param type');
  }
};

const pathResolve = (space, field) => {
  return [space, field ];
  // const shouldDot = space && field && (field[0] !== '[');
  // return shouldDot ? `${space || ''}.${field || ''}` : `${space || ''}${field || ''}`;
};

const getDraft = v => isDraft(v)
  ? v
  : isDraftable(v)
    ? createDraft(v)
    : v;

/**
 * ------------------------------------------------------------
 * Atom
 * ------------------------------------------------------------
 */

class Atom extends PureComponent {
  renderAtom = (ctx) => {
    const { v, pull, push, children } = this.props;
    const { space, store, put } = ctx;
    if (!v) throw new Error('[Atom] must have a [v] prop.');

    const path = v === '/' ? space : pathResolve(space, v);

    const [pullPath, pullSelector] = handlePull(pull);
    const [pushEventName, pushFilter] = handlePush(push);

    const value = pullSelector(_.get(store, path), _.get(store, space));

    let onChange;

    if (push) {
      onChange = (cv) => {
        const next = pushFilter(cv, _.get(store, space));
        put((ctxDraft) => {
          const n = isDraft(next) ? finishDraft(next) : next;
          _.set(ctxDraft, path, n);
        });
      }
    }

    const draftV = getDraft(value);

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
    )
  }
}

/**
 * ------------------------------------------------------------
 * exports
 * ------------------------------------------------------------
 */

 export {
   SpaceProvider,
   Space,
   Atom,
 }
