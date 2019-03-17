import React, { Component } from 'react';
import {
  PageHeader, List, Input, Button, Row, Col, Checkbox, Icon,
} from 'antd';
import { Space, Ship } from 'space';

const Pull = (props) => {
  const {
    children, value, onChange, pull = 'value', push,
  } = props;
  const cp = {
    ...children.props,
    [pull]: value,
  };
  if (push) {
    const pusher = typeof push === 'function' ? push : v => v;
    cp.onChange = (e) => {
      if (typeof onChange === 'function') {
        onChange(pusher(e));
      }
    };
  }
  return React.cloneElement(children, cp);
};

class Todos extends Component {
  onKeyDown = (e) => {
    if (e.key === 'Enter') {
      this.putTudousi((todousi) => {
        const { todos, next } = todousi;
        if (!next) return;
        todos.push({ todo: next, completed: false, key: +new Date() });
        todousi.next = '';
      });
    }
  }

  toggleItemChecked = (item) => {
    this.putTudousi((todousi) => {
      const { todos } = todousi;
      const found = todos.findIndex(i => i.key === item.key);
      if (found > -1) {
        todos[found].completed = !todos[found].completed;
      }
    });
  };

  delItem = (e, item) => {
    this.putTudousi((todousi) => {
      const { todos } = todousi;
      const found = todos.findIndex(i => i.key === item.key);
      if (found > -1) {
        todos.splice(found, 1);
      }
    });
  }

  setFilter = (filter) => {
    this.putTudousi((todousi) => {
      todousi.filter = filter;
    });
  }

  todosFilter = (tudousi) => {
    const { filter, todos } = tudousi;
    switch (filter) {
      case 'todo':
        return todos.filter(i => !i.completed);
      case 'done':
        return todos.filter(i => i.completed);
      default:
        return todos;
    }
  };


  render() {
    return (
      <div>
        <PageHeader
          title="土豆丝"
          subTitle="Todos by space.db"
        />
        <div>
          <Space
            space="todousi"
            init={{ todos: [], filter: 'all', next: '' }}
            put={[this, 'putTudousi']}
          >
            <Ship computer={this.todosFilter}>
              <Pull pull="dataSource">
                <List
                  header={(
                    <div>
                      <Ship bind="next">
                        <Pull push={e => e.target.value}>
                          <Input placeholder="add todo" onKeyDown={this.onKeyDown} />
                        </Pull>
                      </Ship>
                    </div>
                  )}
                  renderItem={item => (
                    <List.Item
                      actions={[
                        <div onClick={e => this.delItem(e, item)}>
                          <Icon type="delete" theme="twoTone" />
                        </div>,
                      ]}
                    >
                      <List.Item.Meta
                        onClick={() => this.toggleItemChecked(item)}
                        avatar={(
                          <span style={{ paddingLeft: '8px' }}>
                            <Checkbox checked={item.completed} />
                          </span>
                        )}
                        title={(
                          <span style={item.completed ? { textDecoration: 'line-through' } : null}>
                            {item.todo}
                          </span>
                        )}
                      />
                    </List.Item>
                  )}
                  footer={(
                    <Row type="flex" justify="space-between" gutter={16}>
                      <Col span={6}>
                        <Ship computer={({ todos }) => `todo: ${todos.filter(i => !i.completed).length} / all: ${todos.length}`}>
                          <Pull pull="children">
                            <Button block />
                          </Pull>
                        </Ship>
                      </Col>
                      <Col span={6}>
                        <Button block type="primary" onClick={() => this.setFilter()}>All</Button>
                      </Col>
                      <Col span={6}>
                        <Button block type="primary" onClick={() => this.setFilter('todo')}>Todos</Button>
                      </Col>
                      <Col span={6}>
                        <Button block onClick={() => this.setFilter('done')}>Done</Button>
                      </Col>
                    </Row>
                )}
                />
              </Pull>
            </Ship>

          </Space>

        </div>
      </div>

    );
  }
}

export default Todos;
