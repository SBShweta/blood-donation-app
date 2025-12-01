
import axios from "axios";


const getBaseURL = () => {
  if (process.env.NODE_ENV === 'production') {
    return '/api'; 
  } else {
    return 'http://localhost:5000/api'; 
  }
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
});


api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['Content-Type'] = 'application/json';
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('userToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userInfo');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;