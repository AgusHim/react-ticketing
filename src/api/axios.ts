import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000';

const axiosInstance = axios.create({
  baseURL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const admin_api = axios.create({
  baseURL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

admin_api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Atau dari Redux/Context
    if (token) {
      config.headers.Authorization = token.startsWith('Bearer ')
        ? token
        : `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

type RetryableRequest = NonNullable<Parameters<typeof admin_api.request>[0]> & {
  _authRetry?: boolean;
};

let refreshRequest: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshRequest) {
    refreshRequest = axiosInstance
      .post('/api/v1/auth/refresh')
      .then((response) => {
        const token = response.data.token as string;
        if (!token) {
          throw new Error('Refresh response did not contain an access token');
        }
        localStorage.setItem('token', token);
        if (response.data.data) {
          localStorage.setItem('user', JSON.stringify(response.data.data));
        }
        return token;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }
  return refreshRequest;
}

admin_api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config as RetryableRequest | undefined;
    if (error.response?.status !== 401 || !request || request._authRetry) {
      return Promise.reject(error);
    }

    request._authRetry = true;
    try {
      const token = await refreshAccessToken();
      request.headers = request.headers || {};
      request.headers.Authorization = `Bearer ${token}`;
      return admin_api.request(request);
    } catch (refreshError) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return Promise.reject(refreshError);
    }
  },
);

export { refreshAccessToken };

export default axiosInstance;
