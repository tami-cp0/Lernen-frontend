'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Cookies from 'js-cookie';
import User from '../types/user';
import axios, { AxiosError } from 'axios';
import { clientEnv } from '../../env.client';
import { useRouter } from 'next/navigation';

const AuthContext = createContext<{
  user: User | null;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  loading: boolean;
}>({
  user: null,
  login: () => {},
  logout: () => {},
  loading: true
});

// stopped at using context in login page, optimize or clean login page code

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // When app starts, check if user is logged in
    const token = Cookies.get('accessToken');
    if (token) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserData = async (isRetry: boolean = false) => {
    console.log('Fetching user data...');
    try {
      const userProfile: User = (await axios.get(`${clientEnv.apiUrl}/api/v1/users/profile`, {
        headers: {
          'Authorization': `Bearer ${Cookies.get('accessToken')}`
        }
      })).data.data;

      setUser(userProfile);
    } catch (error: unknown) {
      // try to refresh token first if 401 error, ensure we don't get into infinite loop
      if (error instanceof AxiosError && error.response?.status === 401 && !isRetry) {
        try {
          const { accessToken, refreshToken } = (await axios.get(`${clientEnv.apiUrl}/api/v1/auth/refresh`, {
            headers: {
              'Authorization': `Bearer ${Cookies.get('refreshToken')}`
            }
          })).data.data;

          login(accessToken, refreshToken);

          await fetchUserData(true); // Retry fetching user data after refreshing token
        } catch (error) {
          logout();

          router.push('/login');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  console.log("reached here")

  const login = (accessToken: string, refreshToken: string) => {
    Cookies.set('accessToken', accessToken, { expires: 7, sameSite: 'strict', secure: false });
    Cookies.set('refreshToken', refreshToken, { expires: 7, sameSite: 'strict', secure: false });
    fetchUserData(); // Get user data after login
  };

  const logout = () => {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};