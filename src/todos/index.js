/* eslint-disable react/prop-types, no-unused-vars */
import React, { PureComponent } from 'react';
import {
  PageHeader, Divider,
} from 'antd';
import { Space, Atom } from 'space';
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
 * Core List
 * ------------------------------------------------------------
 */
const TodoList = (props) => {
  const { list, onChange, todoKiller } = props;

  return list.length > 0 ? (
    <ul>
      {list.map(todo => (
        <li key={todo.key}>
          <button
            type="button"
            onClick={() => {
              /**
              * ------------------------------------------------------------
              * 需要注意, 这里需要 onChange 来触发 store 的更新
              * ------------------------------------------------------------
              */
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


/**
 * ------------------------------------------------------------
 * Todos App
 * ------------------------------------------------------------
 */
class Todos extends PureComponent {
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


  /**
   * ------------------------------------------------------------
   * 一个典型的 pullSelector
   * 第一个参数是 Atom[v] 指定的字段
   * 第二个参数 当前所在 Space 所对应的子 store
   * 注意! 不要在这里修改space
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
          <Space
            space={spaceSymbol}
            init={{ todos: [], filter: 'all', next: '' }}
            // 注意这里的 put
            put={this.setPut}
          >
            <Atom v="next" pull push={e2v}>
              <input type="text" placeholder="input here..." onKeyDown={this.onNextKeyDown} />
            </Atom>
            <Atom v="todos" pull={['list', this.todosSelector]} push>
              <TodoList todoKiller={this.todoKiller} />
            </Atom>
            {/**
              * ------------------------------------------------------------
              * render Props
              * ------------------------------------------------------------
              */}
            <div>
              <Atom v="filter" pull push={['onClick', (e, spaceStore) => 'all']}>
                {/* 此时的 prpos { value: 'all', onClick: (e) => 'all' } */}
                {props => (<button {...props} type="button"> All </button>)}
              </Atom>
              <Atom v="filter" pull push={['onClick', (e, spaceStore) => 'todo']}>
                {/* 此时的 prpos { value: 'all', onClick: (e) => 'all' } */}
                {props => (<button {...props} type="button"> Todos </button>)}
              </Atom>
              <Atom v="filter" pull push={['onClick', (e, spaceStore) => 'done']}>
                {/* 此时的 prpos { value: 'all', onClick: (e) => 'all' } */}
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
