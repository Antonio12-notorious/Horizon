const API_BASE = import.meta.env.VITE_API_URL ?? '';

export const authFetch = (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    return fetch(`${API_BASE}${url}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers,
        }
    });
};