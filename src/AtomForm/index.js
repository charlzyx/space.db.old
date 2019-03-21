import React, { PureComponent } from 'react';
import {
  PageHeader, Divider, Form, Input, Button,
} from 'antd';
import { Space, Atom, discover } from 'space';
import { AtomForm } from '@namespace';
import { eva } from '@helper';


const Field = Form.Item;
const formData = {
  query: {
    username: '',
    password: '',
  },
};

const space = discover(AtomForm);

class AtomFormDemo extends PureComponent {
  toLogin = () => {
    console.log(space.data);
  };

  render() {
    return (
      <div>
        <PageHeader
          title="表单"
          subTitle="powered by space.db"
        />
        <Divider />
        <Space space={AtomForm} init={formData}>
          <div style={{ padding: '8px' }}>
            {/* <Form> */}
            <Field label="用户名" required>
              <Atom vm="query.username" push={eva}>
                <Input placeholder="请输入用户名" />
              </Atom>
            </Field>
            <Field label="密码" required>
              <Atom vm="query.password" push={eva}>
                <Input.Password placeholder="请输入密码" />
              </Atom>
            </Field>
            <Button block type="primary" onClick={this.toLogin}>登录</Button>
            {/* </Form> */}
          </div>
        </Space>

      </div>
    );
  }
}

export default AtomFormDemo;
