const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const buildUrl = (path) => `${API_BASE_URL}${path}`;

export const apiFetch = (path, init = {}) => {
  const url = buildUrl(path);
  return fetch(url, init);
};

export const parseJson = async (response) => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (err) {
    return {};
  }
};

export const apiPostJson = (path, body, init = {}) => {
  return apiFetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    body: JSON.stringify(body),
    ...init,
  });
};

export const apiPatchJson = (path, body, init = {}) => {
  return apiFetch(path, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    body: JSON.stringify(body),
    ...init,
  });
};
