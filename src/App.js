import React, { useState } from 'react';
import './App.css';
import LoginForm from './components/LoginForm';
import LogoutButton from './components/LogoutButton';

function App() {
  const [message, setMessage] = useState('');

  return (
    <div className="App">
      <header className="App-header">
        <h1>로그인 및 로그아웃 페이지</h1>

        <div className="status-box">{message}</div>

        <LoginForm setMessage={setMessage} />

        <div className="button-container">
          <LogoutButton setMessage={setMessage} />
        </div>
      </header>
    </div>
  );
}

export default App;