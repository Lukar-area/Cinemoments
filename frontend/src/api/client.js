const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api';
async function request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        ...options.headers,
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    // Only set application/json if body is not FormData
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'An error occurred while communicating with the server.');
    }
    return data;
}
export const api = {
    auth: {
        login: (credentials) => request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        }),
        guest: () => request('/auth/guest', {
            method: 'POST',
        }),
        register: (payload) => request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),
        me: () => request('/auth/me'),
    },
    theatres: {
        getAll: () => request('/theatres'),
        getById: (id) => request(`/theatres/${id}`),
        create: (data) => request('/theatres', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        update: (id, data) => request(`/theatres/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
    },
    movies: {
        getAll: () => request('/movies'),
        getById: (id) => request(`/movies/${id}`),
        create: (data) => request('/movies', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    },
    shows: {
        getShows: (params) => {
            const search = new URLSearchParams();
            if (params?.theatreId)
                search.set('theatreId', params.theatreId.toString());
            if (params?.movieId)
                search.set('movieId', params.movieId.toString());
            if (params?.date)
                search.set('date', params.date);
            return request(`/shows?${search.toString()}`);
        },
        create: (data) => request('/shows', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    },
    bookings: {
        create: (formData) => request('/bookings', {
            method: 'POST',
            body: formData,
        }),
        getMyBookings: () => request('/bookings/my-bookings'),
        getById: (id) => request(`/bookings/${id}`),
        getStaffBookings: (theatreId, status) => {
            const search = new URLSearchParams();
            if (theatreId)
                search.set('theatreId', theatreId.toString());
            if (status)
                search.set('status', status);
            return request(`/bookings/staff/queue?${search.toString()}`);
        },
        accept: (bookingId) => request(`/bookings/${bookingId}/accept`, {
            method: 'POST',
        }),
        reject: (bookingId, reason) => request(`/bookings/${bookingId}/reject`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
        }),
        cancel: (bookingId) => request(`/bookings/${bookingId}/cancel`, {
            method: 'POST',
        }),
    },
    media: {
        getStreamUrl: (mediaId) => `${API_BASE}/media/${mediaId}/stream`,
    },
    notifications: {
        getAll: () => request('/notifications'),
        markRead: (id) => request(`/notifications/${id}/read`, {
            method: 'PUT',
        }),
        markAllRead: () => request('/notifications/read-all', {
            method: 'PUT',
        }),
    },
    admin: {
        getStats: () => request('/admin/stats'),
        getUsers: () => request('/admin/users'),
        updateUser: (id, data) => request(`/admin/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
        getAuditLogs: (limit = 50) => request(`/admin/audit-logs?limit=${limit}`),
        getBookings: () => request('/admin/bookings'),
    },
    transactions: {
        getMy: () => request('/bookings/transactions/my'),
        getTheatreEarnings: (theatreId) =>
            request(`/bookings/earnings/${theatreId || ''}`),
        getAll: () => request('/bookings/transactions/all'),
    },
    chat: {
        getConversations: (theatreId) => {
            const search = theatreId ? `?theatreId=${theatreId}` : '';
            return request(`/chat/conversations${search}`);
        },
        getMessages: (theatreId, userId) => {
            const search = new URLSearchParams();
            if (theatreId) search.set('theatreId', theatreId.toString());
            if (userId) search.set('userId', userId.toString());
            return request(`/chat/messages?${search.toString()}`);
        },
        sendMessage: (data) =>
            request('/chat/messages', {
                method: 'POST',
                body: JSON.stringify(data),
            }),
    },
    payments: {
        createOrder: (data) => request('/payments/create-order', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        verifyPayment: (data) => request('/payments/verify', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        topupWallet: (data) => request('/payments/wallet/topup', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        getReceipt: (transactionId) => request(`/payments/receipt/${transactionId}`),
    },
};
