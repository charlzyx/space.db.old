/**
 * Welcome to Space/DB
 */
import React, { createContext, useState } from 'react';
import _ from 'lodash';


const DBContext = createContext({});

const SpaceProvider = (props) => {
  const [db, set] = useState({});

  const setter = (path, value) => {
    const nextDB = _.set(_.cloneDeep(db), path, value);
    console.log(path, value, nextDB);
    set(nextDB);
    console.log('db', db);
  };

  const getter = (path) => {
    return _.get(db, path);
  };

  const onChange = (v) => {
    set(v);
  };

  return <DBContext.Provider value={{ value: db, onChange, setter, getter  }}>
    {props.children}
  </DBContext.Provider>
};

// TODO: spaceRender Map Cache
const Space = (props) => {
  const spaceRender = ({ space: ctxSpace, ...ctx }) => {
    const { space, children } = props;
    const spc = space[0] === '#'
      ? space.slice(1)
      : ctxSpace
        ? ctxSpace + '.' + space
        : space;
    return <DBContext.Provider value={{ space: spc, ...ctx }}>
      {children}
    </DBContext.Provider>
  };
  return <DBContext.Consumer>
    {spaceRender}
  </DBContext.Consumer>
};

// TODO: DB Render Cache
const DB = (props) => {
  const dbRender = ({ value: v, space, getter, setter }) => {
    const { field, children } = props;
    const path = field ? `${space}.${field}`: space;
    const value = getter(path);
    console.log(`D ${path}`, value);
    const onChange = v => {
      setter(path, v);
    };

    return React.cloneElement(
      children,
      {
        ...children.props,
        value,
        onChange,
        space,
        field,
      },
    );
  };
  return <DBContext.Consumer>
    {dbRender}
  </DBContext.Consumer>
};

export {
  SpaceProvider,
  Space,
  DB,
}

