import axios from 'axios';

// const api = axios.create({
//     baseURL: 'http://localhost:5000/api',
// });

const api = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api',
});


//rgru


// Add a request interceptor to add the auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = 'Bearer ' + token;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
