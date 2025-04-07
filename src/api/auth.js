import axiosInstance from './config';

export const authService = {
    login: async (credentials) => {
        return axiosInstance.post('/login', credentials);
    },

    register: async (userData) => {
        return axiosInstance.post('/register', userData);
    },

    getCurrentUser: async () => {
        return axiosInstance.get('/me');
    },

    logout: () => {
        localStorage.removeItem('token');
    },
}; 