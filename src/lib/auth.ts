import Cookies from 'js-cookie';

export function isLoggedIn() {
  const token = Cookies.get('accessToken');
  return !!token;
}

export function logout() {
  Cookies.remove('accessToken');
  Cookies.remove('refreshToken');
  window.location.href = '/login';
}