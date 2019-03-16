import React from 'react';
import { useImmer } from 'use-immer';
import _ from 'lodash';


function App() {
  const [person, updatePerson] = useImmer({
    name: 'Michel',
    age: 33,
  });

  function updateName(name) {
    const a = updatePerson((draft) => {
      _.set(draft, 'name', name);
    });
    console.log('aaaaa', a);
  }

  function becomeOlder() {
    updatePerson((draft) => {
      _.set(draft, 'e.b.c', +new Date());
    });
  }

  return (
    <div className="App">
      <pre>
        {JSON.stringify(person, null, 2)}
      </pre>
      <h1>
        Hello
        {person.name}
        {person.age}
      </h1>
      <hr />
      <div>
        {_.get(person, 'a.b.c')}
        {_.get(person, 'e.b.c')}
      </div>
      <hr />
      <input
        onChange={(e) => {
          updateName(e.target.value);
        }}
        value={person.name}
      />
      <br />
      <button type="button" onClick={becomeOlder}>Older</button>
    </div>
  );
}

export default App;
