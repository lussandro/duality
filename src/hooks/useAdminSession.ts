import axios, { AxiosResponse } from 'axios';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { addDays } from 'date-fns';

interface AdminData {
  id: string;
  username: string;
  token: string;
  role: string;
  expirationDate: string;
  queries: number;
  blacklisted: boolean;
}

function validateToken(
  token: string,
  handleLoginError: () => void,
  setAdminData: (adminData: AdminData) => void
) {
  return async () => {
    try {
      const response: AxiosResponse<any> = await axios.get('/api/auth/token', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        const { data } = response;

        if (data.data && data.data.role === 'admin') {
          const adminData: AdminData = {
            id: data.data.id,
            username: data.data.username,
            token: data.token,
            role: data.data.role,
            expirationDate: data.data.expirationDate,
            queries: data.data.queries,
            blacklisted: data.data.blacklisted,
          };
          setAdminData(adminData);
        }
        if (data.token && data.data.role === 'admin') {
          const formattedCookieExpirationDate = addDays(new Date(), 1).toUTCString();
          document.cookie = `token=${data.token}; expires=${formattedCookieExpirationDate}; path=/`;
        } else {
          handleLoginError();
        }
      } else {
        handleLoginError();
      }
    } catch (error) {
      console.error(error);
      handleLoginError();
    }
  };
}

export function useAdminSession() {
  const router = useRouter();
  const [adminData, setAdminData] = useState<AdminData | null>(null);

  const handleLoginError = () => {
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/');
  };

  useEffect(() => {
    function getCookie(name: string) {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith(`${name}=`)) {
          return cookie.substring(name.length + 1);
        }
      }
      return null;
    }

    const token = getCookie('token');
    if (token) {
      const validateTokenCallback = validateToken(token, handleLoginError, setAdminData);
      validateTokenCallback();
    } else {
      handleLoginError();
    }
  }, []);

  return adminData;
}
