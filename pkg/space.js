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
      console.log('[Space final setter]', s);
      setState(s);
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
    const { space, children } = this.props;
    const { space: parentSpace } = ctx;
    const spc = parentSpace ? `${parentSpace}.${space}` : space;

    return (
      <SpaceCtx.Provider value={{ ...ctx, space: spc }}>
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
