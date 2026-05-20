const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export async function fetchFromAPI(endpoint: string, options?: RequestInit) {
    const url = `${API_BASE_URL}${endpoint}`
    const hasBody = options?.body !== undefined
    const response = await fetch(url, {
        ...options, credentials: 'include', headers: {
            ...(hasBody ? { 'Content-Type': 'application/json' }: {}),
            ...options?.headers
        }
    })

    if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        const message = body.message || response.statusText
        throw new Error(`API error: ${response.status} ${message}`)
    }
    if (response.status === 204) {
        return
    }
    return response.json()
}