import React from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment';
import { LocaleProvider } from 'antd';
import zhCN from 'antd/lib/locale-provider/zh_CN';
import 'moment/locale/zh-cn';
import 'antd/dist/antd.css';
import 'normalize.css/normalize.css';
import './app.less';
import App from './app';

moment.locale('zh-cn');

ReactDOM.render(
  <LocaleProvider locale={zhCN}>
    <App />
  </LocaleProvider>,
  document.getElementById('app'),
);

module.hot.accept();
