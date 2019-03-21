/* eslint-disable react/prop-types */
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

import React, { forwardRef, createContext, PureComponent } from 'react';
import PropTypes from 'prop-types';
import hoistNonReactStatics from 'hoist-non-react-statics';
import _ from 'lodash';
import { useImmer } from 'use-immer';
import {
  setAutoFreeze,
  isDraft,
  isDraftable,
  // original,
  createDraft,
  finishDraft,
} from 'immer';
import { piper } from 'ppph';

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
 * SpaceProvider
 * ------------------------------------------------------------
 */

const SpaceProvider = (props) => {
  const [store, put] = useImmer({});
  const ctx = {
    space: null,
    store,
    put,
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
  const parentSpace = parent === null ? [] : Array.isArray(parent) ? parent : [parent];
  return parentSpace.concat(now);
};

/**
 * ------------------------------------------------------------
 * Space
 * ------------------------------------------------------------
 */
class Space extends PureComponent {
  renderSpace = (ctx) => {
    const {
      space: nowSpace, children, init, put: putBind,
    } = this.props;
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
  const spaceArr = Array.isArray(space) ? space : [space];
  const fieldArr = Array.isArray(field) ? field : [field];
  return [...spaceArr, ...fieldArr];
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
      v, pull, push, children,
    } = this.props;
    const { space, store, put } = ctx;
    if (!v && v !== 0) throw new Error('[Atom] must have a [v] prop.');

    const path = v === '/' ? space : pathResolve(space, v);

    const [pullPath, pullSelector] = handlePull(pull);
    const [pushEventName, pushFilter] = handlePush(push);

    const value = pullSelector(_.get(store, path), _.get(store, space));
    const draftV = getDraft(value);

    let onChange;

    if (push) {
      onChange = (cv) => {
        const next = pushFilter(cv, draftV, getDraft(_.get(store, space)));
        put((ctxDraft) => {
          const n = isDraft(next) ? finishDraft(next) : next;
          _.set(ctxDraft, path, n);
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

/**
 * --------------------------------------------
 * AtomPipeHOC
 * --------------------------------------------
 * introduce your pipeHOC
 */
const AtomPipeHOC = (Comp) => {
  class AtomHOC extends PureComponent {
    static displayName = `AtomHOC${Comp.displayName || Comp.name || ''}`;

    static propTypes = {
      forwardRef: PropTypes.oneOfType([
        PropTypes.func,
        // Element is just window.Element, this type for React.createRef()
        PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
      ]),
    };

    static defaultProps = {
      forwardRef: null,
    }

    renderAtom = (ctx) => {
      const { v, pull, push } = this.props;
      const { space, store, put } = ctx;
      if (!v && v !== 0) throw new Error('[Atom] must have a [v] prop.');

      const path = v === '/' ? space : pathResolve(space, v);

      const [pullPath, pullSelector] = handlePull(pull);
      const [pushEventName, pushFilter] = handlePush(push);

      const value = pullSelector(_.get(store, path), _.get(store, space));
      const draftV = getDraft(value);

      let onChange;

      if (push) {
        onChange = (cv) => {
          const next = pushFilter(cv, draftV, getDraft(_.get(store, space)));
          put((ctxDraft) => {
            const n = isDraft(next) ? finishDraft(next) : next;
            _.set(ctxDraft, path, n);
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

      const nextProps = {
        ...childrenProps,
        ref: this.props.forwardRef,
      };
      return <Comp {...nextProps} />;
    }

    render() {
      return (
        <SpaceCtx.Consumer>
          {this.renderAtom}
        </SpaceCtx.Consumer>
      );
    }
  }

  hoistNonReactStatics(AtomHOC, Comp);
  return forwardRef((props, ref) => <AtomHOC {...props} forwardRef={ref} />);
};

/**
 * @param who required. type: String;
 * @param when required. type: (type, props) => boolean | any;
 * @param how required. type: (Comp: ReactElement) => ReactElement;
 * @param why required. type: (e) => void;
 * @param ph type: [pH, key];
 *
 */

/**
 * --------------------------------------------
 * pipe
 * --------------------------------------------
 * introduce your pipe
 */
const AtomPipe = piper({
  who: 'atom', // name for pipe
  when: (type, props) => props.atom, // condition to use the pipe
  how: AtomPipeHOC, // the HOC for this pipe, means how to deal with it
  why: (e) => { // a callback will be call when error occur.
    console.error('[AtomPipeHOC] error: ');
    console.dir(e);
  },
  // pH: means sort weight, just like pH, the lower pH value, the heighter sort weight;
  // key: pependent key name in JSX, which will be sort by write order;
  ph: [7, ''],
});

/**
 * ------------------------------------------------------------
 * exports
 * ------------------------------------------------------------
 */

export {
  SpaceProvider,
  Space,
  Atom,
  AtomPipe,
};
