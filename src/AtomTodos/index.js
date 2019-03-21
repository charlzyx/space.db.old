/* eslint-disable react/prop-types */
import React, { PureComponent } from 'react';
import {
  PageHeader, Divider,
} from 'antd';
import {
  Space, discover, Atom,
} from 'space';
import { TodoList as TodoSpace } from '@namespace';
import actions from './actions';
import './todo.less';

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
// const Show = props => <pre>{JSON.stringify(Object.keys(props), null, 2)}</pre>;

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
 * 不要解构!!!不要解构!!!, 只能在最后使用之前结构, Support TODO
 * ------------------------------------------------------------
 */
const space = discover(TodoSpace);

/**
 * ------------------------------------------------------------
 * Todos App
 * ------------------------------------------------------------
 */
class Todos extends PureComponent {
  onNextKeyDown = (e) => {
    const { data } = space;
    if (e.key === 'Enter') {
      // 比如, 在这解构是可以的
      const { next } = data;
      if (next) {
        const nextTodo = {
          todo: next,
          done: false,
          key: +new Date(),
        };
        actions.addTodo(nextTodo);
        space.put((copy) => {
          copy.next = '';
        });
      }
    }
  }

  todoKiller = (todo) => {
    if (!todo) return;
    actions.removeTodo(todo);
  }

  toggleTodo = (todo) => {
    if (!todo) return;
    actions.toggleTodo(todo);
  }

  onClickFilter = (filter) => {
    space.put((copy) => {
      copy.filter = filter;
    });
    // or
    // actions.setFilter(filter);
  }

  /**
   * ------------------------------------------------------------
   * 一个典型的 pullSelector
   * 第一个参数是 Atom[v] 指定的字段
   * 第二个参数 当前所在 SpaceStore
   * 注意! 不要在这里修改 spaceStore, dev 环境有报错
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
    return (
      <div>
        <PageHeader
          title="土豆丝"
          subTitle="Todos by space.db"
        />
        <Divider />
        <div>
          <div>
            <Space
              space={TodoSpace}
              init={{
                todos: [],
                next: '',
                filter: 'all',
              }}
            >
              <input
                atom
                vm="next"
                push={e2v}
                placeholder="input here..."
                onKeyDown={this.onNextKeyDown}
                type="text"
              />
              {/* <Atom vm="next" push={e2v} type="text">
                <input
                  type="text"
                  placeholder="input here..."
                  onKeyDown={this.onNextKeyDown}
                />
              </Atom> */}
              <Atom v="todos" pull={['list', this.todosSelector]}>
                <TodoList toggleTodo={this.toggleTodo} todoKiller={this.todoKiller} />
              </Atom>
              <div>
                <Atom v="filter" pull push={['onClick', () => 'all']}>
                  <button type="button">All</button>
                </Atom>
                <Atom v="filter" pull>
                  <button type="button" onClick={() => this.onClickFilter('todo')}>todos</button>
                </Atom>
                <Atom v="filter" pull>
                  <button type="button" onClick={() => this.onClickFilter('done')}>Dones</button>
                </Atom>
              </div>
            </Space>
          </div>
        </div>
      </div>
    );
  }
}

export default Todos;
