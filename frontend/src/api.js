import { useCallback, useEffect, useState } from 'react';

const TOKEN_KEY = 'adtech_token';

// Deployed backend URL
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || ''
).replace(/\/$/, '');

export const getToken = () => sessionStorage.getItem(TOKEN_KEY);
export const setToken = (t) => sessionStorage.setItem(TOKEN_KEY);
export const clearToken = () => sessionStorage.removeItem(TOKEN_KEY);

export async function api(path, { method = 'GET', body } = {}) {
  const token = getToken();

  const res = await fetch(`${API_BASE_URL}/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (res.status === 401 && !path.startsWith('/auth/login')) {
    clearToken();
    window.dispatchEvent(new Event('adtech:logout'));
  }

  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong. Try again.');
  }

  return data;
}

// Loads path and exposes { data, loading, error, reload }
export function useApi(path) {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null
  });

  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;

    setState((s) => ({
      ...s,
      loading: true,
      error: null
    }));

    api(path)
      .then((data) =>
        alive && setState({
          data,
          loading: false,
          error: null
        })
      )
      .catch((e) =>
        alive && setState({
          data: null,
          loading: false,
          error: e.message
        })
      );

    return () => {
      alive = false;
    };
  }, [path, tick]);

  const reload = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  return { ...state, reload };
}

// Upload one file with progress
export function uploadFile(file, onProgress, endpoint = '/api/uploads') {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    const uploadUrl =
      `${API_BASE_URL}${endpoint}?filename=${encodeURIComponent(file.name)}`;

    xhr.open('POST', uploadUrl);

    xhr.setRequestHeader('Authorization', `Bearer ${getToken()}`);
    xhr.setRequestHeader(
      'Content-Type',
      file.type || 'application/octet-stream'
    );

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      let data = {};

      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        // Non-JSON response
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data);
      } else {
        reject(new Error(data.error || 'Upload failed. Try again.'));
      }
    };

    xhr.onerror = () => {
      reject(new Error(
        'Upload failed. Check your connection and try again.'
      ));
    };

    xhr.send(file);
  });
}
