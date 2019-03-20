/* eslint-disable react/prop-types, no-unused-vars */
import React, { PureComponent } from 'react';
import {
  PageHeader, Divider,
} from 'antd';
import { Space } from 'space';
import './todo.less';

/**
 * ------------------------------------------------------------
 * Symbol path in store
 * ------------------------------------------------------------
 */
const spaceSymbol = Symbol('data');


/**
 * ------------------------------------------------------------
 * event to value
 * ------------------------------------------------------------
 */
const e2v = e => e.target.value;

/**
 * ------------------------------------------------------------
 * Show own props keys
 * ------------------------------------------------------------
 */
const Show = props => <pre>{JSON.stringify(Object.keys(props), null, 2)}</pre>;

/**
 * ------------------------------------------------------------
 * TodoItem
 * toggleDone: func
 * done: bool
 * todo: string
 * onRemove: func
 * ------------------------------------------------------------
 */

const TodoItem = props => (
  <li>
    <button type="button" onClick={props.toggleDone}>
      {`[${props.index} | ${props.done ? '√' : ' '}]`}
    </button>
    {props.todo}
    <button type="button" onClick={props.onRemove}> remove </button>
  </li>
);
/**
 * ------------------------------------------------------------
 * TodoList
 * ------------------------------------------------------------
 */
const TodoList = (props) => {
  const {
    list, todoKiller, toggleTodo,
  } = props;

  return list.length > 0 ? (
    <ul>
      {list.map((todo, index) => (
        <TodoItem
          key={todo.key}
          toggleDone={() => {
            toggleTodo(todo);
          }}
          onRemove={() => {
            todoKiller(todo);
          }}
          {...todo}
          index={index}
        />
      ))}
    </ul>
  ) : <div>暂无数据</div>;
};


/**
 * ------------------------------------------------------------
 * Todos App
 * ------------------------------------------------------------
 */
class Todos extends PureComponent {
  /**
   * old school
   */
  state = {
    next: '',
    todos: [],
  }

  onKeyDown = (e) => {
    if (e.key === 'Enter') {
      const { todos, next } = this.state;
      this.setState({
        todos: [...todos, { todo: next, done: false, key: +new Date() }],
        next: '',
      });
    }
  }

  /**
   * ------------------------------------------------------------
   * putData 其实就是一个 immer 的 produce 的一层封装, 语法都是一样的
   * ------------------------------------------------------------
   */
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

  toggleTodo = (todo) => {
    if (!todo) return;
    this.putData((data) => {
      const { todos } = data;
      const index = todos.findIndex(td => td.key === todo.key);
      todos[index].done = !todos[index].done;
    });
  }


  /**
   * ------------------------------------------------------------
   * 一个典型的 pullSelector
   * 第一个参数是 Atom[v] 指定的字段
   * 第二个参数 当前所在 Space 所对应的子 store
   * 注意! 不要在这里修改space
   * dev 环境有报错
   * ------------------------------------------------------------
   */
  todosSelector = (todos, spaceStore) => {
    const { filter } = spaceStore;
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
    const { state } = this;
    return (
      <div>
        <PageHeader
          title="土豆丝"
          subTitle="Todos by space.db"
        />
        <Divider />
        <div>
          <div>
            <h2>性能对比: no Space</h2>
            <input type="text" onKeyDown={this.onKeyDown} value={state.next} onChange={e => this.setState({ next: e.target.value })} />
            <TodoList list={state.todos} />
          </div>
          <div>
            <h2>性能对比: Space</h2>
            <Space
              space={spaceSymbol}
              init={{ todos: [], filter: 'all', next: '' }}
            // 注意这里的 put
              put={this.setPut}
            >
              <input atom v="next" pull push={e2v} type="text" placeholder="input here..." onKeyDown={this.onNextKeyDown} />
              <TodoList atom v="todos" pull={['list', this.todosSelector]} toggleTodo={this.toggleTodo} todoKiller={this.todoKiller} />
              <div>
                <button atom type="button" v="filter" pull push={['onClick', () => 'all']}>All</button>
                <button atom type="button" v="filter" pull push={['onClick', () => 'todo']}>Todos</button>
                <button atom type="button" v="filter" pull push={['onClick', () => 'done']}>Dones</button>
              </div>
            </Space>
          </div>
        </div>
      </div>
    );
  }
}

export default Todos;
