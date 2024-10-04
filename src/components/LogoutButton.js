import React from 'react';
import styles from './LogoutButton.module.css';

const LogoutButton = ({ setMessage }) => {
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
      console.log("로그아웃 결과: ", result)
      setMessage('로그아웃 완료되었습니다.');
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error);
      setMessage('로그아웃 중 오류가 발생했습니다.');
    }
  };

  return <button className={styles.logoutButton} onClick={handleLogout}>로그아웃</button>;
};

export default LogoutButton;