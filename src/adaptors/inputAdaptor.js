/* eslint-disable react/prop-types */
import React, { PureComponent } from 'react';
// Adaptor Element
class InputAdaptor extends PureComponent {
  onChange = (e) => {
    const { onChange } = this.props;
    if (onChange) {
      onChange(e.target.value);
    }
  };

  render() {
    const { children, value } = this.props;
    const adaptorProps = {
      ...children.props,
      value,
      onChange: this.onChange,
    };
    return React.cloneElement(children, adaptorProps);
  }
}

export default InputAdaptor;
