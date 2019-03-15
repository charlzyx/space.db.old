import React from 'react';

const Pager = (props) => {
  const { value: page = {}, onChange } = props;
  const {
    current = 0, total = 0, size = 10,
  } = page;

  return new Array(Math.ceil(total / size)).fill(undefined)
    .map((nouse, index) => {
      const active = current === index - 1;
      return (
        <span
          onClick={(e) => {
            e.preventDefault();
            page.current = index + 1;
            onChange(page);
          }}
          style={{ padding: '8px', color: active ? 'lightgreen' : '#fff' }}
        >
          {index + 1}
        </span>
      );
    });
};

export default Pager;
