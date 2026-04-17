// Utility: authenticated fetch that handles token expiry
// On 401: clears token and redirects to login

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('learni_parent_token')
  
  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  
  if (res.status === 401) {
    // Token expired — clear and redirect to login
    localStorage.removeItem('learni_parent_token')
    localStorage.removeItem('learni_parent_name')
    localStorage.removeItem('learni_parent_email')
    localStorage.removeItem('learni_parent_id')
    window.location.href = '/login?expired=true'
    return res
  }
  
  return res
}
