/* eslint-disable react/prop-types */
import React, { Component, useState } from 'react';
import {
  Menu, Row, Col,
} from 'antd';
import { SpaceProvider, Atom, discover } from 'space';
import { eva } from '@helper';


const [got, put, Space] = discover();

const init = [1, 2, 3];
const UseApp = () => (
  <div>
    <Space
      init={init}
    >
      <Atom vm="[0]" put={eva}>
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
            data[0] = +new Date();
          }).then((next) => {
            console.log('put then', next);
          });
          console.log('shadow: no delay', got());
          got.next().then((next) => {
            console.log('shadow: got next after wait', next);
          });
          setTimeout(() => {
            console.log('shadow: settimeout delay', got());
          });
        }}
      >
        click me
      </button>
    </Space>
  </div>
);


class App extends Component {
  state = {
    list: init,
  };

  onChange = (list) => {
    console.log('onChange', list);
    this.setState({ list: [456, 789, 1000] });
  }

  render() {
    const { list } = this.state;
    console.log('render list', list);
    return (
      <div>
        <Space
          init={list}
          onChange={this.onChange}
        >
          <Atom vm="[0]" put={eva}>
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
                data[0] = +new Date();
              }).then((next) => {
                console.log('put then', next);
              });
              console.log('shadow: no delay', got());
              got.next().then((next) => {
                console.log('shadow: got next after wait', next);
              });
              setTimeout(() => {
                console.log('shadow: settimeout delay', got());
              });
            }}
          >
          click me
          </button>
        </Space>
      </div>
    );
  }
}

const Galaxy = () => <SpaceProvider><App /></SpaceProvider>;
// const Galaxy = () => <SpaceProvider><UseApp /></SpaceProvider>;
export default Galaxy;
