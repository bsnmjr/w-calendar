import axios from 'axios';
import { API_URL } from '../config';

const instance = axios.create({
    baseURL: API_URL,
    timeout: 5000
});

const apiHandle = (method = 'GET', url, data = null, token = '', config = null) => {
    return instance({
        method, url, data, headers: { authorization: token }, ...config
    });
}

export default apiHandle;