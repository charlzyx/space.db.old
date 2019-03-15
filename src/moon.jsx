/* eslint-disable react/prop-types */
import React, { Component } from 'react';
import { Space, DB, space } from 'space';
import Pager from './pager';

const List = ({ value: list = [], loading }) => (loading ? 'loading...'
  : (
    <ul>
      {list.map(li => <li key={li.key}>{li.w}</li>)}
    </ul>
  )
);

// console.log(`[http] query${JSON.stringify(query, null, 2)}`);
const http = query => new Promise((resolve) => {
  setTimeout(() => {
    resolve({
      list: [
        { w: 'hello', key: 'h' },
        { w: 'space', key: 'h' },
      ],
      page: {},
    });
  }, 1000);
});
const AsyncDB = (props) => {
  const { value, onChange, children } = props;
  const emitter = (e) => {
    console.log('????', e);
    e.preventDefault();
    http(value).then(() => {
      onChange(value);
    });
  };
  return React.cloneElement(children, { ...children.props, onClick: emitter });
};

class Moon extends Component {
  render() {
    return (
      <div>
        <Space init={{ name: '', age: '' }} space="moon.query">
          <form>
            <DB field="name">
              <input type="text" />
            </DB>
            <DB field="age">
              <input type="text" />
            </DB>
            <DB
              async="list"
            >
              <AsyncDB>
                <button type="button">Click Me!</button>
              </AsyncDB>
            </DB>
          </form>
        </Space>
        <Space init={[]} space="moon.list">
          <DB>
            <List />
          </DB>
        </Space>
        <Space init={{ current: 0, total: 0, size: 10 }} space="moon.query.page">
          <DB>
            <Pager />
          </DB>
        </Space>
      </div>
    );
  }
}

export default Moon;
