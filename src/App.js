import React, { useState, useEffect } from 'react';
import Logo from './logo.svg';
import { List, Avatar, Row, Col } from 'antd';
import 'antd/dist/antd.css';
import './App.css';

const { ipcRenderer } = window;

function App() {
  // 声明一个叫 "count" 的 state 变量
  const [list, setList] = useState([]);
  const [base, setBase] = useState(0);

  useEffect(() => {
    if (!ipcRenderer) return;
    ipcRenderer.invoke('fetch').then((result = []) => {
      setList(result);
    });
    ipcRenderer.addListener('update', (e, result = []) => {
      setList(result);
    });
    return () => {
      ipcRenderer.removeAllListeners('update');
    };
  }, []);
  

  

  const renderItem = val => {
    const { image, html, rtf, bookmark, text } = val;
    let titleContainer = <div ref={(ctr) => {
      ctr.innerHTML = html || text;
    }} />;

    return (
      <List.Item>
        <List.Item.Meta
          avatar={<Avatar src={image ? image.toURL() : Logo} />}
          title={titleContainer}
        />
      </List.Item>
    );
  }
  return (
    <div className="App">
      <List dataSource={list} renderItem={renderItem} />
    </div>
  );
}

export default App;
