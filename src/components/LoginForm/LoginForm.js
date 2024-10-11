import React, { useState, useCallback, useEffect } from 'react';
import { io } from 'socket.io-client';
import useSession from '../../hooks/useSession';
import LogoutButton from '../LogoutButton/LogoutButton';
import styles from './LoginForm.module.css';
import Cookies from 'js-cookie';
import { TextField, Button, Checkbox, FormControlLabel, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import apiUrl from '../../ApiUrl';

const LoginForm = ({ setMessage }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState('');
  const [autoLogin, setAutoLogin] = useState(false);
  const [sessionWarning, setSessionWarning] = useState(false);
  const [socket, setSocket] = useState(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 세션 훅 사용
  useSession(setMessage, isLoggedIn);

  // autoLogin 쿠키에서 자동 로그인 상태 불러오기
  useEffect(() => {
    const storedAutoLogin = Cookies.get('autoLogin') === 'true';
    if (storedAutoLogin) {
      setAutoLogin(storedAutoLogin);
    }
  }, []);

  // 로그아웃 함수
  const logoutWithRetries = useCallback(async () => {
    let retryCount = 0;
    const maxRetries = 5;

    while (retryCount < maxRetries) {
      try {
        const response = await fetch(`${apiUrl}/sign-out`, {
          method: 'POST',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('로그아웃 실패');
        }

        await response.json();
        setMessage('로그아웃이 완료되었습니다.');
        return;
      } catch (error) {
        console.error('로그아웃 중 오류 발생: ', error);
        setMessage('로그아웃 중 오류가 발생했습니다.');
        retryCount++;
        if (retryCount >= maxRetries) {
          console.log('최대 재시도 횟수를 초과하여 더 이상 요청하지 않습니다.');
          return;
        }
      }
    }
  }, [setMessage]);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    await logoutWithRetries();

    // 자동로그인이 아닌 경우 입력폼 초기화
    if (!autoLogin) {
      setEmail('');
      setPassword('');
    }

    setIsLoggedIn(false);
    setMessage('로그아웃되었습니다.');
  }, [isLoggingOut, logoutWithRetries, setMessage]);

  const handleLogin = async (event) => {
    event.preventDefault();
    console.log('로그인 시도 중...');
  
    if (isLoggedIn) return;
  
    const url = autoLogin ? `${apiUrl}/auth/sign-in?autoLogin=true` : `${apiUrl}/auth/sign-in`;
  
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
  
      // 소켓 연결 및 재시도 로직
      const connectSocket = async (attempts) => {
        const newSocket = io(`${apiUrl}`, { withCredentials: true });
  
        return new Promise((resolve, reject) => {
          newSocket.on('connect', () => {
            console.log('소켓이 연결되었습니다. 세션 모니터링 시작합니다.');
            startSessionMonitoring();
            resolve(newSocket);
          });
  
          newSocket.on('connect_error', (error) => {
            console.error("소켓 연결 에러:", error);
            if (attempts > 1) {
              console.log(`소켓 연결 재시도 중... 남은 시도 횟수: ${attempts - 1}`);
              setTimeout(() => {
                connectSocket(attempts - 1).then(resolve).catch(reject);
              }, 1000); // 1초 후 재시도
            } else {
              reject(new Error('소켓 연결 실패: 최대 재시도 횟수 초과'));
            }
          });
        });
      };
  
      try {
        // 최대 시도 횟수 5회로 제한함.
        const newSocket = await connectSocket(5); 
        setSocket(newSocket);
  
        newSocket.on('sessionExpiryWarning', handleSessionExpiryWarning);
        newSocket.on('notification', (message) => console.log("서버로부터 받은 알림:", message));
      } catch (error) {
        console.error('소켓 연결 중 오류 발생:', error);
        setMessage('소켓 연결에 실패했습니다.');
      }
    } catch (error) {
      console.error('로그인 중 오류 발생:', error);
      setMessage('로그인 중 오류가 발생했습니다.');
    }
  };

  // 모니터링 요청
  const startSessionMonitoring = async () => {
    try {
      const monitorResponse = await fetch(`${apiUrl}/session/monitor`, {
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

  // 타이머 포맷팅
  const formatTimeLeft = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 세션 연장
  const handleSessionExtend = async () => {
    try {
      const response = await fetch(`${apiUrl}/session/extend`, {
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
  }, [sessionWarning, timeLeft, isLoggedIn, logoutWithRetries, setMessage]);

  // 비밀번호 상태 변경
  const handleClickShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <form onSubmit={handleLogin} className={styles.loginForm}>
      <TextField
        label="이메일"
        variant="outlined"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        fullWidth
        autoComplete={autoLogin ? 'email' : 'off'}
      />
      <TextField
        name="password"
        id="current-password"
        label="비밀번호"
        variant="outlined"
        type={showPassword ? 'text' : 'password'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        fullWidth
        autoComplete={autoLogin ? 'current-password' : 'off'}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton 
                aria-label="toggle password visibility"
                onClick={handleClickShowPassword} 
                edge="end">
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>  
          ),
        }}
      />
      <FormControlLabel
        control={<Checkbox checked={autoLogin} onChange={(e) => setAutoLogin(e.target.checked)} />}
        label="자동 로그인"
      />
      <Button
        className={styles.loginButton}
        type="submit" 
        variant="contained" 
        color="primary">로그인</Button>
      <br/>
      <LogoutButton onLogout={handleLogout} />
      {sessionWarning && (
        <div className={styles.sessionWarning}>
          <span>세션이 만료됩니다. 남은 시간: {formatTimeLeft(timeLeft)}</span>
          <Button onClick={handleSessionExtend} variant="contained">연장하기</Button>
        </div>
      )}
    </form>
  );
};

export default LoginForm;