/* eslint-disable react/prop-types */
import React, { Component } from 'react';
import {
  Menu, Row, Col,
} from 'antd';
import { SpaceProvider, Space, Atom } from 'space';
import { Menus } from '@namespace';
import Todos from './AtomTodos';
import Form from './AtomForm';


class App extends Component {
  onSelect = ({ selectedKeys }) => selectedKeys

  render() {
    return (
      <Space
        space={Menus}
        init={{
          selectedKeys: ['form'],
        }}
      >
        <Row>
          <Col span={6}>
            <Atom v="selectedKeys" pull="selectedKeys" push={['onSelect', this.onSelect]}>
              <Menu
                // selectedKeys={['form']}
                theme="dark"
                mode="inline"
                style={{
                  height: '100vh',
                  overflowY: 'auto',
                }}
              >
                <Menu.Item key="todos">
                  <span>土豆丝</span>
                </Menu.Item>
                <Menu.Item key="form">
                  <span>Form</span>
                </Menu.Item>
              </Menu>
            </Atom>
          </Col>
          <Col span={18}>
            <Atom v="selectedKeys" pull={keys => keys[0]}>
              {({ value }) => {
                switch (value) {
                  case 'todos':
                    return <Todos />;
                  case 'form':
                    return <Form />;
                  default:
                    return <Todos />;
                }
              }}
            </Atom>

          </Col>
        </Row>
      </Space>
    );
  }
}

const Galaxy = () => <SpaceProvider><App /></SpaceProvider>;
export default Galaxy;
