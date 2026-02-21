import ky from 'ky'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

export const api = ky.create({
    prefixUrl: API_URL,
    hooks: {
        beforeRequest: [
            (request) => {
                const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
                if (token) {
                    request.headers.set('Authorization', `Bearer ${token}`)
                }
            },
        ],
        afterResponse: [
            async (_request, _options, response) => {
                // Handle authentication errors
                if (response.status === 401) {
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem('token')
                        window.location.href = '/login'
                    }
                }
            },
        ],
    },
    retry: {
        limit: 2,
        methods: ['get', 'put', 'head', 'delete'],
    },
})
