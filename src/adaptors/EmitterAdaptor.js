/* eslint-disable react/prop-types */
import React, { Component } from 'react';

class EmitterAdaptor extends Component {
  onEmit = (e) => {
    const { value, onChange } = this.props;
    e.preventDefault();
    // http(value).then((resp) => {
    //   onChange(resp.list);
    // });
    // onChange(http(value));
  };

  render() {
    const { children } = this.props;
    const adaptorProps = {
      ...children.props,
      onClick: this.onEmit,
    };

    return React.cloneElement(children, adaptorProps);
  }
}

export default EmitterAdaptor;
