import { useEffect, useCallback } from 'react';
import apiUrl from '../ApiUrl';

const useSession = (setMessage, isLoggedIn) => {
  const startSessionMonitoring = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const monitorResponse = await fetch(`${apiUrl}/session/monitor`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!monitorResponse.ok) throw new Error('세션 모니터링 시작 실패');
      console.log('세션 모니터링 시작됨.');
    } catch (error) {
      console.error('세션 모니터링 중 오류 발생:', error);
      setMessage('세션 모니터링 중 오류가 발생했습니다.');
    }
  }, [isLoggedIn, setMessage]);

  useEffect(() => {
    if (isLoggedIn) {
      startSessionMonitoring();
    }
  }, [isLoggedIn, startSessionMonitoring]);
};

export default useSession;