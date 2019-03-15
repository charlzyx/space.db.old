/* eslint-disable react/prop-types */
import React, { Component } from 'react';
import { SpaceProvider, Space, Ship } from 'space';

const List = ({ value: list, spaceLoading }) => {
  console.log(list);
  return (spaceLoading ? 'space loading...'
    : (
      <ul>
        {list.map(li => <li key={li.key}>{li.w}</li>)}
      </ul>
    )
  );
};

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

const http = query => new Promise((resolve) => {
  console.log('http: query\n', `${JSON.stringify(query, null, 2)}`);
  setTimeout(() => {
    resolve({
      list: [
        { key: 'm', w: 'moon' },
        { key: 'max', w: 'spacex' },
        { key: 'cz', w: 'changezheng' },
      ],
      page: {},
    });
  }, 10000);
});

class EmitterAdaptor extends Component {
   onEmit = (e) => {
     const { value, onChange } = this.props;
     e.preventDefault();
     // http(value).then((resp) => {
     //   onChange(resp.list);
     // });
     onChange(http(value));
   };

   render() {
     const { children, spaceLoading } = this.props;
     console.log(this.props);
     const adaptorProps = {
       ...children.props,
       onClick: this.onEmit,
     };

     return spaceLoading ? 'space loading...' : React.cloneElement(children, adaptorProps);
   }
}


class App extends Component {
  render() {
    return (
      <div>
        <h1>
          9012 A Space Odyssey
        </h1>
        <Space
          space="earth"
          init={{
            query: {
              name: 1,
              age: 2,
            },
            birth: '2001-01-01',
            moons: {
              list: [],
              page: {},
            },
          }}
        >
          <Ship field="query.name">
            <InputAdaptor>
              <input type="query.text" />
            </InputAdaptor>
          </Ship>
          <Ship field="query.age">
            <InputAdaptor>
              <input type="text" />
            </InputAdaptor>
          </Ship>
          <Ship field="query" asyncField="moons">
            <EmitterAdaptor>
              <input type="button" value="发射" />
            </EmitterAdaptor>
          </Ship>
          <Ship field="moons.list">
            <List />
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
