import React from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment';
import { LocaleProvider } from 'antd';
import zhCN from 'antd/lib/locale-provider/zh_CN';
import 'moment/locale/zh-cn';
import 'antd/dist/antd.css';
import 'normalize.css/normalize.css';
import './app.less';
import ppph, { piper } from 'ppph';
import { Atomic } from 'space';
import App from './app';

const atomic = piper({
  who: 'atomic',
  when: (type, props) => props.atom,
  how: Atomic,
  why: (e) => {
    console.log('Atomic Error\n', e);
  },
  ph: [-7, 'atom'],
});

ppph.use(atomic);
ppph.inject();

moment.locale('zh-cn');

ReactDOM.render(
  <LocaleProvider locale={zhCN}>
    <App />
  </LocaleProvider>,
  document.getElementById('app'),
);

module.hot.accept();
