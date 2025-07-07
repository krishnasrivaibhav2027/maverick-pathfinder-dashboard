export async function login(username: string, password: string) {
  const response = await fetch('/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username, password }),
  });
  if (!response.ok) throw new Error('Login failed');
  const data = await response.json();
  localStorage.setItem('access_token', data.access_token);
  return data;
}

export function getToken() {
  return localStorage.getItem('access_token');
}

export async function getProtectedData() {
  const token = getToken();
  if (!token) throw new Error('No token found');
  const response = await fetch('/protected', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Not authorized');
  return response.json();
} 