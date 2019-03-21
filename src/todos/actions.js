import { discover } from '../../pkg/space';
import { TodoList } from '../namespace';

const space = discover(TodoList);

export default {
  addTodo: todo => space.put((data) => {
    data.todos.push(todo);
  }),
  toggleTodo: todo => space.put((data) => {
    const { todos } = data;
    const len = todos.length;
    for (let i = 0; i <= len; i++) { // eslint-disable-line
      if (todos[i].key === todo.key) {
        todos[i].done = !todos[i].done;
        return;
      }
    }
  }),
  removeTodo: todo => space.put((data) => {
    const { todos } = data;
    const len = todos.length;
    for (let i = 0; i <= len; i++) { // eslint-disable-line
      if (todos[i].key === todo.key) {
        todos.splice(i, 1);
        return;
      }
    }
  }),
  setFilter: filter => space.put((data) => {
    data.filter = filter;
  }),
};
