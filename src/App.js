import React, {Component} from 'react';
import logo from './logo.svg';
import './App.css';
import {DB, Space, SpaceProvider} from './db';
import C137 from './c-137';
import C233 from './c-233';

export const Show = (props) => {
  const onChange = (e) => {
    props.onChange(e.target.value);
  };
  return <fieldset>
    <legend>{`[${props.space} / ${props.field}]`}</legend>
    <div>
      <code>{JSON.stringify(props, null, 2)}</code>
    </div>

    <div>
      <input value={props.value} onChange={onChange} type="text"/>
    </div>
  </fieldset>
};

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo"/>
          <p>
            [space / field]
          </p>
          <p>
            Edit <code>src/App.js</code> and save to reload.
          </p>

        </header>
        <div className="App-header">
          <div className="flex">
            <Space space="galaxy">
              <DB>
                <Show/>
              </DB>
            </Space>
          </div>
          <C233/>
          <C137/>
        </div>
      </div>
    );
  }
}

const Galaxy = () => <SpaceProvider><App/></SpaceProvider>;

export default Galaxy;
