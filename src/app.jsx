/* eslint-disable react/prop-types */
import React, { Component } from 'react';
import { SpaceProvider, Space, Ship } from 'space';

// Adaptor Element
class InputAdaptor extends Component {
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


class App extends Component {
  render() {
    return (
      <div>
        <h1>
          9012 A Space Odyssey
        </h1>
        <Space space="earth">
          <Ship field="name">
            <InputAdaptor>
              <input type="text" />
            </InputAdaptor>
          </Ship>
          <Ship field="age">
            <InputAdaptor>
              <input type="text" />
            </InputAdaptor>
          </Ship>
          <Space space="mars.age">
            <Ship>
              <InputAdaptor>
                <input type="number" />
              </InputAdaptor>
            </Ship>
            <Space space="earth.rocket">
              <Ship>
                <InputAdaptor>
                  <input type="text" />
                </InputAdaptor>
              </Ship>
            </Space>
          </Space>
          <Ship field="birth">
            <InputAdaptor>
              <input type="date" />
            </InputAdaptor>
          </Ship>
        </Space>
        <Space space="moon.age">
          <Ship>
            <InputAdaptor>
              <input type="number" />
            </InputAdaptor>
          </Ship>
        </Space>
      </div>
    );
  }
}


const Galaxy = () => <SpaceProvider><App /></SpaceProvider>;
export default Galaxy;
