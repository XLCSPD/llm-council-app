import axios from 'axios';

// Create axios instance with defaults
export const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add any auth tokens here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors
    if (error.response) {
      const { status, data } = error.response;

      if (status === 401) {
        // Handle unauthorized
        console.error('Unauthorized request');
      } else if (status === 404) {
        console.error('Resource not found:', data.detail);
      } else if (status >= 500) {
        console.error('Server error:', data.detail);
      }
    } else if (error.request) {
      console.error('Network error - no response received');
    }

    return Promise.reject(error);
  }
);
