/* eslint-disable react/prop-types */
import React, { Component } from 'react';
import {
  SpaceProvider, Space, Ship, space,
} from 'space';
import InputAdaptor from './adaptors/inputAdaptor';

const List = ({ value: list, awaiting }) => {
  console.log('list\n', list, awaiting);
  const [pending, error] = awaiting;
  return pending
    ? 'loadnig....'
    : error
      ? (
        <pre>
          {error.message}
          <br />
          {error.stack}
        </pre>
      )
      : (
        <ul>
          {list.map(li => <li key={li.key}>{li.w}</li>)}
        </ul>
      );
};


const http = query => new Promise((resolve, reject) => {
  console.log('http: query\n', `${JSON.stringify(query, null, 2)}`);
  setTimeout(() => {
    if (Math.random() > 0.2) {
      resolve({
        list: [
          { key: 'm', w: 'moon' },
          { key: 'max', w: 'spacex' },
          { key: 'cz', w: 'changezheng' },
        ],
        page: {},
      });
    } else {
      reject(new Error('some thing error'));
    }
  }, 3000);
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
     const { children } = this.props;
     const adaptorProps = {
       ...children.props,
       onClick: this.onEmit,
     };

     return React.cloneElement(children, adaptorProps);
   }
}

class App extends Component {
  toPut = () => {
    console.log('space.pull, all', space.pull(''));
    console.log('space.pull, earth', space.pull('earth'));
    console.log('space.pull, moons', space.pull('earth', 'moons'));
    space.put('earth', 'moons.list', [
      { key: 'm', w: 'put moon' },
      { key: 'max', w: 'put spacex' },
      { key: 'cz', w: 'put changezheng' },
    ]);
  };

  render() {
    console.log(space);
    return (
      <div>
        <h1>
          9012 A Space Odyssey
        </h1>
        <h3>
          <button type="button" onClick={this.toPut}>pull && put</button>
        </h3>
        <Space
          space="earth"
          init={{
            query: {
              name: 1,
              age: 2,
            },
            birth: '2001-01-01',
            moons: {
              list: [{ w: 'init', key: 'init' }],
              page: {},
            },
          }}
        >
          <Ship field="query.name">
            <InputAdaptor>
              <input type="text" />
            </InputAdaptor>
          </Ship>
          <Ship field="query.age">
            <InputAdaptor>
              <input type="text" />
            </InputAdaptor>
          </Ship>
          <hr />
          <Ship computed={[['query.age', 'query.name'], ([age, name]) => `name is ${name}, age is ${age}`]}>
            <input type="text" />
          </Ship>
          <hr />
          <Ship field="query" await="moons">
            <EmitterAdaptor>
              <input type="button" value="发射" />
            </EmitterAdaptor>
          </Ship>
          <Ship field="moons.list">
            <List />
          </Ship>
          <Space space="mars">
            <Ship field="age">
              <InputAdaptor>
                <input type="number" placeholder="mars.age" />
              </InputAdaptor>
            </Ship>
            <Space space="rocket">
              <Ship field="launch">
                <InputAdaptor>
                  <input type="text" placeholder="mars.rocket.launch" />
                </InputAdaptor>
              </Ship>
            </Space>
          </Space>
          <Ship field="birth">
            <InputAdaptor>
              <input type="date" placeholder="birth" />
            </InputAdaptor>
          </Ship>
        </Space>
        <Space space="moon">
          <Ship field="age">
            <InputAdaptor>
              <input type="number" placeholder="moon" />
            </InputAdaptor>
          </Ship>
        </Space>
      </div>
    );
  }
}


const Galaxy = () => <SpaceProvider><App /></SpaceProvider>;
export default Galaxy;
