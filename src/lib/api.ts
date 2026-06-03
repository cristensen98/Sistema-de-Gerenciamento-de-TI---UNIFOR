export const apiFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  return fetch(input, {
    ...init,
    credentials: 'include'
  });
};
