// import axios from "axios";

// const api = axios.create({
//   baseURL: '/api', // points to backend container
// });

// export default api;


// import axios from "axios";

// const api = axios.create({
//   baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
// });

// export default api;



import axios from "axios";

// Determine base URL based on environment
const getBaseURL = () => {
  if (process.env.NODE_ENV === 'production') {
    return '/api'; // Relative path for production (nginx proxy)
  } else {
    return 'http://localhost:5000/api'; // Direct backend for development
  }
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
});

// Request interceptor for authentication
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

// Response interceptor for error handling
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