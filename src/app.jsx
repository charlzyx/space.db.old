/* eslint-disable react/prop-types */
import React, { Component } from 'react';
import { Menu, Row, Col } from 'antd';
import { SpaceProvider } from 'space';
import Todos from './todos';


class App extends Component {
  render() {
    return (
      <Row>
        <Col span={6}>
          <Menu
            selectedKeys={['todo']}
            theme="dark"
            mode="inline"
            style={{
              height: '100vh',
              overflowY: 'auto',
            }}
          >
            <Menu.Item key="todo">
              <span>土豆丝</span>
            </Menu.Item>
          </Menu>
        </Col>
        <Col span={18}>
          <Todos />
        </Col>
      </Row>
    );
  }
}

const Galaxy = () => <SpaceProvider><App /></SpaceProvider>;
export default Galaxy;
