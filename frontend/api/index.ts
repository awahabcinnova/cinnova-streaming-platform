const API_BASE_URL = '';

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
        if (response.status === 401) return null;
        if (!response.ok) {
            throw new Error(`Failed to load current user (${response.status})`);
        }
        return response.json();
    },
};

export const videoAPI = {
    getAllVideos: async (skip: number = 0, limit: number = 100) => {
        const response = await fetch(`${API_BASE_URL}/api/v1/videos/?skip=${skip}&limit=${limit}`, { credentials: 'include' });
        return response.json();
    },

    getVideoById: async (id: string) => {
        const response = await fetch(`${API_BASE_URL}/api/v1/videos/${id}`, { credentials: 'include' });
        return response.json();
    },

    getVideosByUser: async (userId: string) => {
        const response = await fetch(`${API_BASE_URL}/api/v1/videos/user/${userId}`, { credentials: 'include' });
        return response.json();
    },

    searchVideos: async (query: string) => {
        const response = await fetch(`${API_BASE_URL}/api/v1/videos/search?q=${encodeURIComponent(query)}`, { credentials: 'include' });
        return response.json();
    },

    getLikedVideos: async () => {
        const response = await fetch(`${API_BASE_URL}/api/v1/videos/liked`, { credentials: 'include' });
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

    likeVideo: async (id: string) => {
        const response = await fetch(`${API_BASE_URL}/api/v1/videos/${id}/like`, {
            method: 'POST',
            credentials: 'include',
        });
        return response.json();
    },

    dislikeVideo: async (id: string) => {
        const response = await fetch(`${API_BASE_URL}/api/v1/videos/${id}/dislike`, {
            method: 'POST',
            credentials: 'include',
        });
        return response.json();
    },
};

export const commentAPI: {
    getComments: (videoId: string) => Promise<any>;
    createComment: (videoId: string, text: string, parentId?: string | null) => Promise<any>;
    updateComment: (commentId: string, text: string) => Promise<any>;
    deleteComment: (commentId: string) => Promise<Response>;
} = {
    getComments: async (videoId: string) => {
        const response = await fetch(`${API_BASE_URL}/api/v1/comments/video/${videoId}`, { credentials: 'include' });
        return response.json();
    },

    createComment: async (videoId: string, text: string, parentId?: string | null) => {
        const response = await fetch(`${API_BASE_URL}/api/v1/comments/create`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                video_id: videoId,
                text,
                parent_id: parentId ?? null,
            }),
        });
        return response.json();
    },

    updateComment: async (commentId: string, text: string) => {
        const response = await fetch(`${API_BASE_URL}/api/v1/comments/${commentId}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
        });
        return response.json();
    },

    deleteComment: async (commentId: string) => {
        const response = await fetch(`${API_BASE_URL}/api/v1/comments/${commentId}`, {
            method: 'DELETE',
            credentials: 'include',
        });
        return response;
    },
};

export const userAPI = {
    getUser: async (id: string) => {
        const response = await fetch(`${API_BASE_URL}/api/v1/users/${id}`, { credentials: 'include' });
        return response.json();
    },

    searchUsers: async (query: string) => {
        const response = await fetch(`${API_BASE_URL}/api/v1/users/search?q=${encodeURIComponent(query)}`, { credentials: 'include' });
        return response.json();
    },
};

export const subscriptionAPI = {
    subscribe: async (channelId: string, subscriberId: string) => {
        const response = await fetch(`${API_BASE_URL}/api/v1/subscriptions/subscribe`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                channel_id: channelId,
                subscriber_id: subscriberId,
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
