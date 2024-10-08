import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import styles from './LoginForm.module.css';

// 세션 만료 알림 테스트를 위해 10초로 설정해놓음.
/*
클라이언트 로직
1. 로그인을 한다.
2. 10초 뒤 서버에서 소켓을 통해 세션 만료 알림을 보내준다.
3. 세션 연장 버튼을 누를 수 있다.
- 10초 동안 동작
- 버튼 누름 O : 세션 연장됨. 
- 버튼 누름 X : 소켓 통신 종료, 세션 만료되면 자동으로 로그인 됨.
*/

const LoginForm = ({ setMessage }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [autoLogin, setAutoLogin] = useState(false);
  const [sessionWarning, setSessionWarning] = useState(false);
  const [socket, setSocket] = useState(null);
  const [timeLeft, setTimeLeft] = useState(10); // 10초

  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  useEffect(() => {
    let timer;
    if (sessionWarning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }

    if (timeLeft === 0) {
      setSessionWarning(false);
      handleLogout(); 
    }

    return () => clearInterval(timer); 
  }, [sessionWarning, timeLeft]);

  const handleLogin = async (event) => {
    event.preventDefault();
    const url = autoLogin ? 'http://localhost:3000/auth/sign-in?autoLogin=true' : 'http://localhost:3000/auth/sign-in';

    try {
      const response = await fetch(url, {
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

      // 소켓을 로그인 후에 연결
      const newSocket = io("http://localhost:3000", { withCredentials: true });
      setSocket(newSocket);

      newSocket.on('connect', async () => {
        console.log("소켓 연결됨:", newSocket.id);

        // 세션 모니터링 시작
        const monitorResponse = await fetch('http://localhost:3000/session/monitor', {
          method: 'POST',
          credentials: 'include',
        });

        if (!monitorResponse.ok) {
          throw new Error('세션 모니터링 시작 실패');
        }

        console.log("세션 모니터링 시작 결과: ", await monitorResponse.json());
      });

      // 소켓 연결 오류 시 알림
      newSocket.on('connect_error', (error) => {
        console.error("소켓 연결 에러:", error);
      });

      // 세션 만료 경고 이벤트 리스너
      newSocket.on('sessionExpiryWarning', () => {
        setSessionWarning(true);
        setTimeLeft(10); 
      });

      // 소켓으로부터 알림 수신
      newSocket.on('notification', (message) => {
        console.log("서버로부터 받은 알림:", message);
      });

    } catch (error) {
      console.error('로그인 중 오류 발생:', error);
      setMessage('로그인 중 오류가 발생했습니다.');
    }
  };

  const handleSessionExtend = async () => {
    try {
      const response = await fetch('http://localhost:3000/session/extend', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('세션 연장 실패');
      }

      const result = await response.json();
      console.log("세션 연장 결과: ", result);
      setMessage('세션이 연장되었습니다.');
      setSessionWarning(false);
      setTimeLeft(10);
    } catch (error) {
      console.error('세션 연장 중 오류 발생:', error);
      setMessage('세션 연장 중 오류가 발생했습니다.');
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:3000/auth/sign-out', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('로그아웃 실패');
      }

      const result = await response.json();
      console.log("로그아웃 결과: ", result);
      setMessage('로그아웃 완료되었습니다.');

      setEmail('');
      setPassword('');
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error);
      setMessage('로그아웃 중 오류가 발생했습니다.');
    }
  };

  const formatTimeLeft = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
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
      <div className={styles.formGroup}>
        <label>
          <input
            type="checkbox"
            checked={autoLogin}
            onChange={(e) => setAutoLogin(e.target.checked)}
          />
          자동 로그인
        </label>
      </div>
      <button type="submit" className={styles.loginButton}>로그인</button>

      {sessionWarning && (
        <div className={styles.sessionWarning}>
          <span>세션이 만료됩니다. 남은 시간: {formatTimeLeft(timeLeft)}</span>
          <button onClick={handleSessionExtend} className={styles.extendButton}>연장하기</button>
        </div>
      )}
    </form>
  );
};

export default LoginForm;