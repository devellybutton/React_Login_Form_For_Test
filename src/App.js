import React, { useState } from 'react';
import LoginForm from './components/LoginForm';
import LogoutButton from './components/LogoutButton';

function App() {
  const [message, setMessage] = useState('');

  return (
    <div>
      <header>
        <h1>로그인 및 로그아웃 페이지</h1>

        <div>
          <LoginForm setMessage={setMessage} />
          
          <br />
          
          <LogoutButton setMessage={setMessage} />
        </div>

        {message && <p>{message}</p>}
      </header>
    </div>
  );
}

export default App;