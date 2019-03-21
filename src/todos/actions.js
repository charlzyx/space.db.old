import { action } from '../../pkg/space';
import { TodoList } from '../namespace';

action(TodoList, data => ({
  addTodo: (todo) => {
    data.todos.push(todo);
  },
  toggleTodo: (todo) => {
    const { todos } = data;
    const len = todos.length;
    for (let i = 0; i <= len; i++) { // eslint-disable-line
      if (todos[i].key === todo.key) {
        todos[i].done = !todos[i].done;
        return;
      }
    }
  },
  removeTodo: (todo) => {
    const { todos } = data;
    const len = todos.length;
    for (let i = 0; i <= len; i++) { // eslint-disable-line
      if (todos[i].key === todo.key) {
        todos.splice(i, 1);
        return;
      }
    }
  },
  setFilter: (filter) => {
    data.filter = filter;
  },
}));
