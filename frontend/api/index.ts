// API Service for connecting frontend to backend
// Use same-origin relative URLs (works with Vite proxy in development)
const API_BASE_URL = '';

// Authentication API
export const authAPI = {
    login: async (email: string, password: string) => {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                username: email,
                password: password,
            }),
        });
        return response.json();
    },

    register: async (email: string, password: string, first_name: string, last_name: string) => {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                email,
                password,
                first_name,
                last_name,
            }),
        });
        return response.json();
    },

    getCurrentUser: async () => {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/users/me`, {
            credentials: 'include',
        });
        return response.json();
    },
};

// Video API
export const videoAPI = {
    getAllVideos: async (skip: number = 0, limit: number = 100) => {
        const response = await fetch(`${API_BASE_URL}/api/v1/videos/?skip=${skip}&limit=${limit}`, { credentials: 'include' });
        return response.json();
    },

    getVideoById: async (id: string) => {
        const response = await fetch(`${API_BASE_URL}/api/v1/videos/${id}`, { credentials: 'include' });
        return response.json();
    },

    createVideo: async (formData: FormData) => {
        const response = await fetch(`${API_BASE_URL}/api/v1/videos/`, {
            method: 'POST',
            credentials: 'include',
            body: formData,
        });
        return response.json();
    },

    updateVideo: async (id: string, data: Partial<any>) => {
        const response = await fetch(`${API_BASE_URL}/api/v1/videos/${id}`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        return response.json();
    },

    deleteVideo: async (id: string) => {
        const response = await fetch(`${API_BASE_URL}/api/v1/videos/${id}`, {
            method: 'DELETE',
            credentials: 'include',
        });
        return response.json();
    },

    trackView: async (id: string) => {
        const response = await fetch(`${API_BASE_URL}/api/v1/videos/${id}/views`, {
            method: 'POST',
            credentials: 'include',
        });
        return response.json();
    },
};

// Comment API
export const commentAPI = {
    getComments: async (videoId: string) => {
        const response = await fetch(`${API_BASE_URL}/api/v1/comments/video/${videoId}`, { credentials: 'include' });
        return response.json();
    },

    createComment: async (videoId: string, userId: string, text: string) => {
        const response = await fetch(`${API_BASE_URL}/api/v1/comments/create`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                video_id: parseInt(videoId),
                user_id: parseInt(userId),
                text,
            }),
        });
        return response.json();
    },
};

// User API
export const userAPI = {
    getUser: async (id: string) => {
        const response = await fetch(`${API_BASE_URL}/api/v1/users/${id}`, { credentials: 'include' });
        return response.json();
    },
};

// Subscription API
export const subscriptionAPI = {
    subscribe: async (channelId: string, subscriberId: string) => {
        const response = await fetch(`${API_BASE_URL}/api/v1/subscriptions/subscribe`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                channel_id: parseInt(channelId),
                subscriber_id: parseInt(subscriberId),
            }),
        });
        return response.json();
    },

    unsubscribe: async (channelId: string, subscriberId: string) => {
        const response = await fetch(`${API_BASE_URL}/api/v1/subscriptions/`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                channel_id: channelId,
                subscriber_id: subscriberId,
            }),
        });
        return response.json();
    },

    getSubscribers: async (channelId: string) => {
        const response = await fetch(`${API_BASE_URL}/api/v1/subscriptions/channel/${channelId}`, { credentials: 'include' });
        return response.json();
    },
};

// Livestream API
export const livestreamAPI = {
    getAllLivestreams: async (skip: number = 0, limit: number = 100) => {
        const response = await fetch(`${API_BASE_URL}/api/v1/livestreams/?skip=${skip}&limit=${limit}`, { credentials: 'include' });
        return response.json();
    },

    getLivestream: async (id: string) => {
        const response = await fetch(`${API_BASE_URL}/api/v1/livestreams/${id}`, { credentials: 'include' });
        return response.json();
    },

    createLivestream: async (data: any) => {
        const response = await fetch(`${API_BASE_URL}/api/v1/livestreams/`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        return response.json();
    },
};