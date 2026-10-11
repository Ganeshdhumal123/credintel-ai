import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response error interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'An unexpected error occurred.';
    if (error.response) {
      const data = error.response.data;
      if (typeof data === 'string') {
        message = data;
      } else if (data && data.detail) {
        if (typeof data.detail === 'string') {
          message = data.detail;
        } else if (Array.isArray(data.detail)) {
          message = data.detail.map((e) => e.msg || JSON.stringify(e)).join(', ');
        }
      } else if (data && data.message) {
        message = data.message;
      } else {
        message = `Error ${error.response.status}: ${error.response.statusText}`;
      }
    } else if (error.request) {
      message = 'No response from server. Is the backend running?';
    } else {
      message = error.message;
    }
    error.friendlyMessage = message;
    return Promise.reject(error);
  }
);

export const healthCheck = () => api.get('/health');

export const getModelInfo = () => api.get('/api/v1/model/info');

export const createApplication = (data) => api.post('/api/v1/applications', data);

export const getApplications = (skip = 0, limit = 20) =>
  api.get('/api/v1/applications', { params: { skip, limit } });

export const getApplication = (id) => api.get(`/api/v1/applications/${id}`);

export const analyzeApplication = (id) => api.post(`/api/v1/applications/${id}/analyze`);

export const queryAssistant = (question) =>
  api.post('/api/v1/assistant/query', { question });

export const getRagStats = () => api.get('/api/v1/assistant/stats');

export const uploadPolicyDocument = (formData) =>
  api.post('/api/v1/assistant/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export default api;
