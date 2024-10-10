import React from 'react';
import styles from './LogoutButton.module.css';

const LogoutButton = ({ onLogout }) => {
  return (
  <button className={styles.logoutButton} onClick={onLogout}>로그아웃</button>
  );
};

export default LogoutButton;