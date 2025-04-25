// API configuration
export const API_BASE_URL = 'http://localhost:5000/api';

// Token management helpers
export const getToken = () => localStorage.getItem('token');
export const setToken = (token) => localStorage.setItem('token', token);
export const removeToken = () => localStorage.removeItem('token');

// User data management
export const getUserData = () => {
  const data = localStorage.getItem('userData');
  return data ? JSON.parse(data) : null;
};

export const setUserData = (userData) => {
  localStorage.setItem('userData', JSON.stringify(userData));
};

export const removeUserData = () => {
  localStorage.removeItem('userData');
};

// Logout helper
export const logout = () => {
  removeToken();
  removeUserData();
}; 