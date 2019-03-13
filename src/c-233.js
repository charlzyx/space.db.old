import React from 'react';
import './App.css';
import { Space, DB,} from "./db";
import {Show} from "./App";

const C233 = () => {
  return <div className="flex">
    <h3>c-233 Morty on Earth.</h3>
    <Space space="c_233">
      <DB field="b">
        <Show/>
      </DB>
      <Space space="c">
        <DB field="d">
          <Show/>
        </DB>
        <Space space="e">
          <DB field="f">
            <Show/>
          </DB>
        </Space>
        <Space space="#sync">
          <DB field="biu">
            <Show/>
          </DB>
        </Space>
        <Space space="h">
          <DB>
            <Show/>
          </DB>
        </Space>
      </Space>
    </Space>
    <Space space="b">
      <DB field="ig">
        <Show/>
      </DB>
    </Space>
  </div>
};
export default C233;