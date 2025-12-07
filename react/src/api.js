import axios from 'axios';

const API_PREFIX = '/api/php';

const api = axios.create({
    baseURL: API_PREFIX,
    withCredentials: true,
});

export default api;
