/* eslint-disable react/prop-types */
import React, { Component, useState } from 'react';
import {
  Menu, Row, Col,
} from 'antd';
import { SpaceProvider, Atom, discover } from 'space';
import { eva } from '@helper';


const [got, put, Space] = discover();

const UseApp = () => (
  <div>
    <Space
      onChange={v => console.log('onchange', v)}
      value={{ query: { name: '233', age: 14 } }}
    >
      <Atom vm="query.name" put={eva}>
        <input
          type="text"
          onChange={() => {
            // setTimeout(() => {
            //   console.log('onInput', got());
            // });
          }}
        />
      </Atom>
      <button
        type="button"
        onClick={() => {
          put((data) => {
            data.query.name = +new Date();
          });
          console.log('no delay', got());
          got.next().then((next) => {
            console.log('after wait', next);
          });
          got.next((next) => {
            console.log('cb next', next);
          });
          setTimeout(() => {
            console.log('delay', got());
          });
        }}
      >
        click me
      </button>
    </Space>
  </div>
);


class App extends Component {
  onSelect = ({ selectedKeys }) => selectedKeys

  render() {
    return (
      <div>
        App
      </div>
    );
  }
}

// const Galaxy = () => <SpaceProvider><App /></SpaceProvider>;
const Galaxy = () => <SpaceProvider><UseApp /></SpaceProvider>;
export default Galaxy;
