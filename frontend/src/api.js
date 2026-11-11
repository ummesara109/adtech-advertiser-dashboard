import { useCallback, useEffect, useState } from 'react';

const TOKEN_KEY = 'adtech_token';

// Keep previously fetched GET responses in memory.
// This cache lasts until the browser page is refreshed or closed.
const responseCache = new Map();

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? '' : 'https://adtech-advertiser-dashboard-xvka.vercel.app')
).replace(/\/$/, '');

const getCacheKey = (path) => `${getToken() || 'anonymous'}:${path}`;

export const getToken = () => sessionStorage.getItem(TOKEN_KEY);

export const setToken = (token) => {
  responseCache.clear();
  sessionStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = () => {
  responseCache.clear();
  sessionStorage.removeItem(TOKEN_KEY);
};

export async function api(path, { method = 'GET', body, signal } = {}) {
  const token = getToken();
  const requestMethod = method.toUpperCase();

  const res = await fetch(`${API_BASE_URL}/api${path}`, {
    method: requestMethod,
    signal,
    cache: 'no-store',
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

  // Any successful write may make previously cached data outdated.
  if (!['GET', 'HEAD'].includes(requestMethod)) {
    responseCache.clear();
  }

  return data;
}

export function useApi(path) {
  const [state, setState] = useState(() => {
    const cached = responseCache.get(getCacheKey(path));

    return {
      data: cached ?? null,
      loading: cached == null,
      error: null
    };
  });

  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    const cacheKey = getCacheKey(path);
    const cached = responseCache.get(cacheKey);

    // Display cached data immediately when navigating back.
    setState({
      data: cached ?? null,
      loading: cached == null,
      error: null
    });

    // Always fetch fresh data in the background.
    api(path, { signal: controller.signal })
      .then((data) => {
        if (!alive) return;

        responseCache.set(cacheKey, data);

        setState({
          data,
          loading: false,
          error: null
        });
      })
      .catch((error) => {
        if (!alive || error.name === 'AbortError') return;

        setState((previous) => ({
          ...previous,
          loading: false,
          error: error.message
        }));
      });

    return () => {
      alive = false;
      controller.abort();
    };
  }, [path, tick]);

  const reload = useCallback(() => {
    setTick((value) => value + 1);
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

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      let data = {};

      try {
        data = JSON.parse(xhr.responseText);
      } catch {}

      if (xhr.status >= 200 && xhr.status < 300) {
        responseCache.clear();
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