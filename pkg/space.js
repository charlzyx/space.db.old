/* eslint-disable react/prop-types */
/**
 * Space/DataBinding
 */
import React, { createContext, Component, useState } from 'react';
import _ from 'lodash';

const isThenable = p => typeof p.then === 'function';

// const withoutThenable = v => (isThenable(v) ? v : undefined);

const SpaceCtx = createContext({});

const SpaceProvider = (props) => {
  const [state, setState] = useState({});

  const ctx = {
    space: null,
    value: state,
    onChange: (s) => {
      // console.debug('[Space next]\n', `${JSON.stringify(s, null, 2)}`);
      console.debug('[Space next]\n', s);
      // TODO: immer.js
      // setState(_.cloneDeepWith(s, withoutThenable));
      setState(_.cloneDeep(s));
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
    // TODO: init check and Map to reset
    const { space, children, init } = this.props;
    const { space: parentSpace, value, onChange } = ctx;
    const spc = parentSpace ? `${parentSpace}.${space}` : space;
    const isEmpty = _.get(value, space) === undefined;
    const next = { ...ctx, space: spc };
    if (init && isEmpty) {
      next.value = _.set(value, space, init);
      onChange(value);
    }

    return (
      <SpaceCtx.Provider value={next}>
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
      space, value, onChange,
    } = ctx;
    // console.log('Ship value', value);
    const { children, field, asyncField } = this.props;
    if (!children) {
      console.warn('[space.Ship] must have an children');
      return null;
    }
    // async
    let change;
    if (asyncField) { // async
      change = (next) => {
        if (isThenable(next)) {
          const now = _.get(value, space)[asyncField];
          if (asyncField === 'moons') {
            now.__space_async__ = true;
          }
          const nextValue = _.set(value, `${space}.${asyncField}`, now);
          onChange(nextValue);
          next.then((awaitNext) => {
            const awaitNextValue = _.set(value, `${space}.${asyncField}`, awaitNext);
            onChange(awaitNextValue);
          });
        } else {
          const nextValue = _.set(value, `${space}.${asyncField}`, next);
          onChange(nextValue);
        }
      };
    } else if (field) { // sync
      change = (next) => {
        const nextValue = _.set(value, `${space}.${field}`, next);
        onChange(nextValue);
      };
    } else {
      change = (next) => {
        const spaces = space.split('.');
        const nextField = spaces.splice(-1)[0];
        const nextSpace = spaces.splice(-2, 1)[0];
        const nextValue = _.set(value, nextSpace === spaces[0] ? '' : nextSpace, {
          ..._.get(value, nextSpace),
          [nextField]: next,
        });
        onChange(nextValue);
      };
    }
    const path = field ? `${space}.${field}` : space;
    const v = _.get(value, path);
    const cp = {
      ...children.props,
      value: v,
      onChange: change,
    };
    const moons = _.get(value, 'earth.moons');
    if (field === 'moons.list' && moons && moons.__space_async__) {
      console.log('loading...', v);
      cp.spaceLoading = true;
    }
    if (cp.spaceLoading) {
      console.log(children, cp);
    }
    return React.cloneElement(children, cp);
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
