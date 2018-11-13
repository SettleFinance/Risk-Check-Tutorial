import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import qs from 'query-string';
import * as serviceWorker from './serviceWorker';

const params = qs.parse(window.location.search)

ReactDOM.render(<App token={ params.token } viewMode={ params.mode } />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
