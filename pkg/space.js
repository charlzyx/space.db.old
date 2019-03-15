/* eslint-disable react/prop-types */
/**
 * Space/DataBinding
 */
import React, { createContext, Component, useState } from 'react';
import _ from 'lodash';

const SpaceCtx = createContext({});

const SpaceProvider = (props) => {
  const [state, setState] = useState({});

  const ctx = {
    space: null,
    value: state,
    onChange: (s) => {
      console.debug('[Space next]\n', `${JSON.stringify(s, null, 2)}`);
      // TODO: immer.js
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
    const { children, field } = this.props;
    let change;
    if (field) {
      change = (next) => {
        const nextValue = _.set(value, space, {
          ..._.get(value, space),
          [field]: next,
        });
        onChange(nextValue);
      };
    } else {
      change = (next) => {
        // TODO: root space
        const nextField = space.split('.').splice(-1)[0];
        const nextSpace = space.split('.').splice(-2, 1)[0];
        const nextValue = _.set(value, nextSpace, {
          ..._.get(value, nextSpace),
          [nextField]: next,
        });
        onChange(nextValue);
      };
    }
    const path = field ? `${space}.${field}` : space;
    const cp = {
      ...children.props,
      value: _.get(value, path),
      onChange: change,
    };
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
