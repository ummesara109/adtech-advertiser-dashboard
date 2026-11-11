import { useCallback, useEffect, useState } from 'react';

const TOKEN_KEY = 'adtech_token';

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? '' : 'https://adtech-advertiser-dashboard-xvka.vercel.app')
).replace(/\/$/, '');

export const getToken = () => sessionStorage.getItem(TOKEN_KEY);
export const setToken = (t) => sessionStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => sessionStorage.removeItem(TOKEN_KEY);

export async function api(path, { method = 'GET', body, signal } = {}) {
  const token = getToken();

  const res = await fetch(`${API_BASE_URL}/api${path}`, {
    method,
    signal,
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

export function useApi(path) {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null
  });

  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    setState(s => ({ ...s, loading: true, error: null }));

    api(path, { signal: controller.signal })
      .then(data => {
        if (!alive) return;
        setState({ data, loading: false, error: null });
      })
      .catch(e => {
        if (!alive || e.name === 'AbortError') return;
        setState(s => ({ ...s, loading: false, error: e.message }));
      });

    return () => {
      alive = false;
      controller.abort();
    };
  }, [path, tick]);

  const reload = useCallback(() => {
    setTick(t => t + 1);
  }, []);

  return { ...state, reload };
}

export function uploadFile(file, onProgress, endpoint = '/api/uploads') {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    const uploadUrl =
      `${API_BASE_URL}${endpoint}?filename=${encodeURIComponent(file.name)}`;

    xhr.open('POST', uploadUrl);

    const token = getToken();
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.setRequestHeader(
      'Content-Type',
      file.type || 'application/octet-stream'
    );

    xhr.upload.onprogress = e => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      let data = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {}

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data);
      } else {
        reject(new Error(data.error || 'Upload failed. Try again.'));
      }
    };

    xhr.onerror = () => reject(
      new Error('Upload failed. Check your connection and try again.')
    );

    xhr.send(file);
  });
}