import axios from 'axios';

// PHP API - for php backend
const API_PREFIX = '/api/php';

const api = axios.create({
    baseURL: API_PREFIX,
    withCredentials: true,
});

// Node.js API - for node backend
const NODE_API_PREFIX = '/api/node';

export const nodeApi = axios.create({
    baseURL: NODE_API_PREFIX,
    withCredentials: true,
});

export default api;
