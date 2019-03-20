/* eslint-disable react/prop-types, no-unused-vars */
import React, { PureComponent } from 'react';
import {
  PageHeader, Divider,
  //  List, Input, Button, Row, Col, Checkbox, Icon,
} from 'antd';
import { Space, Atom } from 'space';
import './todo.less';

const e2v = e => e.target.value;
const Show = props => <pre>{JSON.stringify(Object.keys(props), null, 2)}</pre>;
const TodoList = (props) => {
  const { list, onChange, todoKiller } = props;

  return list.length > 0 ? (
    <ul>
      {list.map(todo => (
        <li key={todo.key}>
          <button
            type="button"
            onClick={() => {
              todo.done = !todo.done;
              onChange(list);
            }}
          >
            {`[${todo.done ? '√' : ' '}]`}
          </button>
          {todo.todo}
          <button type="button" onClick={() => { todoKiller(todo); }}>
            remove
          </button>
        </li>
      ))}
    </ul>
  )
    : <div>暂无数据</div>;
};

class Todos extends PureComponent {
  setPut = (put) => {
    this.putData = put;
  };

  onNextKeyDown = (e) => {
    if (e.key === 'Enter') {
      this.putData((data) => {
        const { todos, next } = data;
        if (!data.next) return;
        todos.push({
          todo: next,
          done: false,
          key: +new Date(),
        });
        data.next = '';
      });
    }
  }

  todoKiller = (todo) => {
    if (!todo) return;
    this.putData((data) => {
      const { todos } = data;
      const index = todos.findIndex(td => td.key === todo.key);
      todos.splice(index, 1);
    });
  }

  todosSelector = (todos, space) => {
    const { filter } = space;
    return todos.filter((td) => {
      switch (filter) {
        case 'done':
          return td.done;
        case 'todo':
          return !td.done;
        default:
          return true;
      }
    });
  }

  render() {
    return (
      <div>
        <PageHeader
          title="土豆丝"
          subTitle="Todos by space.db"
        />
        <Divider />
        <div>
          <Space
            space={Symbol('data')}
            init={{ todos: [], filter: 'all', next: '' }}
            put={this.setPut}
          >
            <Atom v="next" pull push={e2v}>
              <input type="text" placeholder="input here..." onKeyDown={this.onNextKeyDown} />
            </Atom>
            <Atom v="todos" pull={['list', this.todosSelector]} push>
              <TodoList todoKiller={this.todoKiller} />
            </Atom>
            <div>
              <Atom v="filter" pull="active" push={['onClick', () => 'all']}>
                {props => (<button {...props} type="button"> All </button>)}
              </Atom>
              <Atom v="filter" pull="active" push={['onClick', () => 'todo']}>
                {props => (<button {...props} type="button"> Todos </button>)}
              </Atom>
              <Atom v="filter" pull="active" push={['onClick', () => 'done']}>
                {props => (<button {...props} type="button"> Dones </button>)}
              </Atom>
            </div>
          </Space>
        </div>
      </div>

    );
  }
}

export default Todos;
