import apiClient from './axios.config';

export const authApi = {
  // POST /api/auth/register
  register: async (userData) => {
    return apiClient.post('/auth/register', {
      email: userData.email,
      username: userData.username,
      firstName: userData.firstName,
      lastName: userData.lastName,
      password: userData.password
    }); // { success: true, data: token }
  },

  // POST /api/auth/login
  login: async (credentials) => {
    return apiClient.post('/auth/login', {
      email: credentials.email,
      password: credentials.password
    }); // { success: true, data: token }
  },

  // POST /api/auth/validate-token
  validateToken: async (token) => {
    return apiClient.post('/auth/validate-token', token);
  }
};
