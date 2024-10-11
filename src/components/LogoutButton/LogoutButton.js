import React from 'react';
import { Button } from '@mui/material';
import styles from './LogoutButton.module.css';

const LogoutButton = ({ onLogout }) => {
  return (
    <Button 
      className={styles.logoutButton}
      type="submit" 
      variant="contained" 
      color="primary" 
      onClick={onLogout}
    >
      로그아웃
    </Button>
  );
};

export default LogoutButton;