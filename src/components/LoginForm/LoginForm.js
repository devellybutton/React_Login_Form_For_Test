import React, { useState, useCallback, useEffect } from 'react';
import { io } from 'socket.io-client';
import useSession from '../../hooks/useSession';
import LogoutButton from '../LogoutButton/LogoutButton';
import styles from './LoginForm.module.css';
import Cookies from 'js-cookie';

const LoginForm = ({ setMessage }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [autoLogin, setAutoLogin] = useState(false);
  const [sessionWarning, setSessionWarning] = useState(false);
  const [socket, setSocket] = useState(null);
  const [timeLeft, setTimeLeft] = useState(10); // 10초 (테스트용)
  const [isLoggingOut, setIsLoggingOut] = useState(false); // 로그아웃 중인지 여부
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 로그인 상태 추가

  // 세션 훅 사용
  useSession(setMessage, isLoggedIn); // 로그인 상태 전달

  // autoLogin 쿠키에서 자동 로그인 상태 불러오기
  useEffect(() => {
    const storedAutoLogin = Cookies.get('autoLogin') === 'true';
    if (storedAutoLogin) {
      setAutoLogin(true);
      const storedEmail = localStorage.getItem('userEmail');
      if (storedEmail) {
        setEmail(storedEmail);
        setPassword('●●●●●●●');
      }
    }
  }, []);

  // 로그아웃 함수
  const logoutWithRetries = useCallback(async () => {
    let retryCount = 0; // 재시도 카운터
    const maxRetries = 5; // 최대 재시도 횟수

    while (retryCount < maxRetries) {
      try {
        const response = await fetch('http://localhost:3000/auth/sign-out', {
          method: 'POST',
          credentials: 'include',
        });
    
        if (!response.ok) {
          throw new Error('로그아웃 실패');
        }
    
        await response.json();

        setMessage('로그아웃이 완료되었습니다.');

        // 로그아웃이 완료된 후에도 자동 로그인 상태라면 이메일과 가짜 비밀번호 설정
        if (autoLogin) {
          const storedEmail = localStorage.getItem('userEmail');
          if (storedEmail) {
            setEmail(storedEmail); // 이메일 유지
            setPassword('●●●●●●●'); // 가짜 비밀번호 유지
          }
        } else {
          setEmail(''); // 자동 로그인 해제 시 이메일 초기화
          setPassword(''); // 비밀번호도 초기화
        }

        console.log('로그아웃이 완료되었습니다.');
        return;
      } catch (error) {
        console.error('로그아웃 중 오류 발생: ', error);
        setMessage('로그아웃 중 오류가 발생했습니다.');
        retryCount++;
        if (retryCount >= maxRetries) {
          console.log('최대 재시도 횟수를 초과하여 더 이상 요청하지 않습니다.')
          return; 
        }
      }
    }
  }, [setMessage, autoLogin]);

  // 소켓 연결 종료 및 입력폼 초기화
  // 로그아웃 이후 진행할 것들
  const cleanupAfterLogout = useCallback(() => {
    if (socket) {
      socket.disconnect();
      socket.off();
      console.log("소켓 연결이 종료되었습니다.")
      setSocket(null);
    }
    // 모든 세션과 로그인 상태 초기화
    setIsLoggingOut(false); // 로그인 중 = 아님
    setIsLoggedIn(false); // 로그인 상태 = 아님
    // setEmail(autoLogin ? localStorage.getItem('userEmail') : ''); // 자동 로그인 체크 시 이메일 설정
    // setPassword(autoLogin ? '●●●●●●●' : ''); // 가짜 비밀번호 설정
    setSessionWarning(false); // 세션 경고 = 없어야 됨
    setTimeLeft(10); // 타이머 초기화
  }, [socket]);

  // 로그아웃
  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return; // 이미 로그아웃 중이면 종료
    setIsLoggingOut(true); // 로그아웃 시작

    await logoutWithRetries();
    cleanupAfterLogout();

    setIsLoggedIn(false);
    setMessage('로그아웃되었습니다.'); 
  }, [isLoggingOut, cleanupAfterLogout, logoutWithRetries, setMessage]);  
  
  // 로그인
  const handleLogin = async (event) => {
    event.preventDefault();
    console.log('로그인 시도 중...');

    if (isLoggedIn) return;

    const url = autoLogin ? 'http://localhost:3000/auth/sign-in?autoLogin=true' : 'http://localhost:3000/auth/sign-in';

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (!response.ok) throw new Error('로그인 실패');

      await response.json();
      setMessage('로그인 완료되었습니다.');
      setIsLoggedIn(true);

      // 자동 로그인 체크가 되어 있을 때만 이메일 저장
      if (autoLogin) {
        const storedEmail = localStorage.getItem('userEmail');
        if (storedEmail) {
          setEmail(storedEmail); 
          setPassword('●●●●●●●'); 
        }
      }

      // 소켓 연결
      const newSocket = io("http://localhost:3000", { withCredentials: true });
      setSocket(newSocket);

      // 소켓 이벤트 핸들러 등록
      newSocket.on('connect', () => {
        console.log('소켓이 연결되었습니다. 세션 모니터링 시작합니다.');
        startSessionMonitoring(); // 로그인 성공 후 소켓이 연결될 때 호출
      });

      newSocket.on('connect_error', (error) => console.error("소켓 연결 에러:", error));
      newSocket.on('sessionExpiryWarning', handleSessionExpiryWarning);
      newSocket.on('notification', (message) => console.log("서버로부터 받은 알림:", message));
    } catch (error) {
      console.error('로그인 중 오류 발생:', error);
      setMessage('로그인 중 오류가 발생했습니다.');
    }
  };

  // 모니터링 요청
  const startSessionMonitoring = async () => {
    try {
      const monitorResponse = await fetch('http://localhost:3000/session/monitor', {
        method: 'POST',
        credentials: 'include',
      });

      if (!monitorResponse.ok) throw new Error('세션 모니터링 시작 실패');
      console.log('세션 모니터링 시작됨.')
    } catch (error) {
      console.error('세션 모니터링 중 오류 발생:', error);
    }
  };

  // 세션 경고문
  const handleSessionExpiryWarning = () => {
    setSessionWarning(true);
    setTimeLeft(10);
  };

  // 세션 연장
  const handleSessionExtend = async () => {
    try {
      const response = await fetch('http://localhost:3000/session/extend', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('세션 연장 실패');

      await response.json();
      setMessage('세션이 연장되었습니다.');
      setSessionWarning(false);
      setTimeLeft(10);
    } catch (error) {
      console.error('세션 연장 중 오류 발생:', error);
      setMessage('세션 연장 중 오류가 발생했습니다.');
    }
  };

  // 타이머 포맷팅
  const formatTimeLeft = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

// 타이머
useEffect(() => {
  let timer;

  const handleTimeout = async () => {
    setSessionWarning(false);
    setMessage('세션이 만료되었습니다.');
    await logoutWithRetries();
  };

    if (sessionWarning && timeLeft > 0 && isLoggedIn) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isLoggedIn) {
      handleTimeout();
    }

    return () => clearInterval(timer);
  }, [sessionWarning, timeLeft, isLoggedIn]);

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
          autoComplete={autoLogin ? 'email' : 'off'}
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
          autoComplete={autoLogin ? 'current-password' : 'off'}
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
      <LogoutButton onLogout={handleLogout} /> 
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