import React, { useState } from 'react';
import styles from './LoginForm.module.css';

const LoginForm = ({ setMessage }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/auth/sign-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('로그인 실패');
      }

      const result = await response.json();
      console.log("로그인 결과: ", result);
      setMessage('로그인 완료되었습니다.');
    } catch (error) {
      console.error('로그인 중 오류 발생:', error);
      setMessage('로그인 중 오류가 발생했습니다.');
    }
  };

  return (
    <form onSubmit={handleLogin} className={styles.loginForm}>
      <div className={styles.formGroup}>
        <label htmlFor="email">이메일:</label>
        <input
          type="email"
          id="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="password">비밀번호:</label>
        <input
          type="password"
          id="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <button type="submit" className={styles.loginButton}>로그인</button>
    </form>
  );
};

export default LoginForm;