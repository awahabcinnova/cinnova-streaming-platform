import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Video } from '../types';
import { Edit2, Trash2, Eye, Calendar, Search, Filter, MoreVertical, X, Save, Upload, PenTool } from 'lucide-react';
import { Link } from 'react-router-dom';
import { videoAPI } from '../api';

// Generate Mock User Videos
const generateUserVideos = (userId: string, count: number): Video[] => {
    return Array.from({ length: count }).map((_, i) => ({
        id: `uv${i}`,
        title: `My Awesome Video Project #${i + 1}: Behind the Scenes`,
        description: "This is a description for my video. I worked really hard on this one! Hope you enjoy it.",
        thumbnail: `https://picsum.photos/seed/uv${i}/640/360`,
        url: "",
        views: Math.floor(Math.random() * 50000),
        uploadedAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toLocaleDateString(),
        duration: "10:05",
        tags: ["vlog", "project"],
        uploader: {
            id: userId,
            username: 'DemoCreator',
            avatar: 'https://picsum.photos/seed/user1/100/100',
            subscribers: 12500
        }
    }));
};

const Channel: React.FC = () => {
    const { user, refreshMe } = useAuth();
    const [videos, setVideos] = useState<Video[]>([]);
    const [search, setSearch] = useState('');

    // Edit Modal State
    const [editingVideo, setEditingVideo] = useState<Video | null>(null);
    const [editForm, setEditForm] = useState({ title: '', description: '' });

    const [banner, setBanner] = useState(user?.banner || '');
    const [avatar, setAvatar] = useState(user?.avatar || '');
    const bannerInputRef = useRef<HTMLInputElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    // Sync user data with local state when user object changes
    useEffect(() => {
        if (user) {
            setBanner(user.banner || '');
            setAvatar(user.avatar || '');
        }
    }, [user]);

    const filteredVideos = useMemo(() => {
        return videos.filter(v => v.title.toLowerCase().includes(search.toLowerCase()));
    }, [videos, search]);

    useEffect(() => {
        if (!user?.id) return;
        // Fetch all videos uploaded by this user
        const fetchUserVideos = async () => {
            try {
                const allVideos = await videoAPI.getAllVideos();
                const userVideos = allVideos.filter((v: Video) => v.uploader.id === user.id);
                setVideos(userVideos);
            } catch {
                setVideos([]);
            }
        };
        fetchUserVideos();
    }, [user?.id]);

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this video? This action cannot be undone.")) {
            try {
                await videoAPI.deleteVideo(id);
                setVideos(videos.filter(v => v.id !== id));
            } catch { }
        }
    };

    const handleEditClick = (video: Video) => {
        setEditingVideo(video);
        setEditForm({ title: video.title, description: video.description });
    };

    const handleSaveEdit = async () => {
        if (!editingVideo) return;
        try {
            await videoAPI.updateVideo(editingVideo.id, { title: editForm.title, description: editForm.description });
            setVideos(videos.map(v =>
                v.id === editingVideo.id
                    ? { ...v, title: editForm.title, description: editForm.description }
                    : v
            ));
            setEditingVideo(null);
        } catch { }
    };

    // Handle avatar upload
    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const formData = new FormData();
            formData.append('avatar', e.target.files[0]);
            await fetch('/api/v1/users/me/avatar', {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });
            await refreshMe();
        }
    };
    // Handle banner upload
    const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const formData = new FormData();
            formData.append('banner', e.target.files[0]);
            await fetch('/api/v1/users/me/banner', {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });
            await refreshMe();
        }
    };
    // Remove avatar
    const handleRemoveAvatar = async () => {
        await fetch('/api/v1/users/me/avatar', {
            method: 'DELETE',
            credentials: 'include',
        });
        await refreshMe();
    };
    // Remove banner
    const handleRemoveBanner = async () => {
        await fetch('/api/v1/users/me/banner', {
            method: 'DELETE',
            credentials: 'include',
        });
        await refreshMe();
    };

    if (!user) return <div>Please log in</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Channel Header */}
            <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                {/* Banner */}
                <div className="h-32 md:h-48 bg-gradient-to-r from-slate-800 to-slate-600 relative">
                    {user.banner && (
                        <img src={user.banner} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
                    )}
                    <button
                        className="absolute bottom-4 right-4 bg-black/40 text-white px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-md hover:bg-black/60 transition-colors flex items-center gap-2"
                        onClick={() => bannerInputRef.current?.click()}
                    >
                        <PenTool size={14} /> {user.banner ? 'Change Banner' : 'Upload Banner'}
                    </button>
                    {user.banner && (
                        <button
                            className="absolute bottom-4 left-4 bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-700 transition-colors"
                            onClick={handleRemoveBanner}
                        >
                            Remove Banner
                        </button>
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        ref={bannerInputRef}
                        style={{ display: 'none' }}
                        onChange={handleBannerChange}
                    />
                </div>

                {/* Profile Info */}
                <div className="px-6 pb-6">
                    <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-10">
                        <div className="relative">
                            <img
                                src={user.avatar}
                                alt={user.username}
                                className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-md bg-white object-cover"
                            />
                            <div
                                className="absolute bottom-1 right-1 bg-blue-600 text-white p-1.5 rounded-full border-2 border-white cursor-pointer"
                                onClick={() => avatarInputRef.current?.click()}
                                title="Change Avatar"
                            >
                                <Edit2 size={12} />
                            </div>
                            {user.avatar && (
                                <button
                                    className="absolute top-1 left-1 bg-red-600 text-white p-1 rounded-full border-2 border-white hover:bg-red-700"
                                    onClick={handleRemoveAvatar}
                                    title="Remove Avatar"
                                >
                                    <Trash2 size={12} />
                                </button>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                ref={avatarInputRef}
                                style={{ display: 'none' }}
                                onChange={handleAvatarChange}
                            />
                        </div>

                        <div className="flex-1 mb-2">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{user.username}</h1>
                            <div className="text-gray-500 text-sm flex items-center gap-2 mt-1">
                                <span>@{user.username.toLowerCase()}</span>
                                <span>•</span>
                                <span>{user.subscribers.toLocaleString()} subscribers</span>
                                <span>•</span>
                                <span>{videos.length} videos</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Management Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
                    <h2 className="text-xl font-bold">Channel Content</h2>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Filter videos..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                            />
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
                            <Filter size={18} />
                            Filter
                        </button>
                        <Link to="/upload" className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 text-sm font-medium">
                            <Upload size={18} />
                            Create
                        </Link>
                    </div>
                </div>

                {/* Video Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="py-3 px-4 w-[40%]">Video</th>
                                <th className="py-3 px-4">Date</th>
                                <th className="py-3 px-4">Views</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-gray-700">
                            {filteredVideos.map((video) => (
                                <tr key={video.id} className="border-b border-gray-100 hover:bg-gray-50 group transition-colors">
                                    <td className="py-4 px-4">
                                        <Link to={`/watch/${video.id}`} className="flex gap-4">
                                            <div className="relative w-32 aspect-video rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                                                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                                                <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded">{video.duration}</div>
                                            </div>
                                            <div className="flex flex-col justify-center max-w-sm">
                                                <h3 className="font-semibold text-gray-900 line-clamp-1 mb-1">{video.title}</h3>
                                                <p className="text-gray-500 line-clamp-1 text-xs">{video.description}</p>
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="py-4 px-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-gray-400" />
                                            {video.uploadedAt}
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <Eye size={14} className="text-gray-400" />
                                            {video.views.toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEditClick(video)}
                                                className="p-2 hover:bg-blue-100 text-blue-600 rounded-full transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(video.id)}
                                                className="p-2 hover:bg-red-100 text-red-600 rounded-full transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            <button className="p-2 hover:bg-gray-200 text-gray-600 rounded-full transition-colors">
                                                <MoreVertical size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredVideos.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center text-gray-500">
                                        No videos found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {editingVideo && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold">Edit Video Details</h3>
                            <button onClick={() => setEditingVideo(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="flex gap-6">
                                <div className="w-1/3">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail</label>
                                    <div className="aspect-video rounded-lg overflow-hidden relative group">
                                        <img src={editingVideo.thumbnail} alt="Thumb" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                            <span className="text-white text-xs font-medium bg-black/60 px-2 py-1 rounded">Change</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-2/3 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                        <input
                                            type="text"
                                            value={editForm.title}
                                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <textarea
                                            rows={4}
                                            value={editForm.description}
                                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                onClick={() => setEditingVideo(null)}
                                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                className="px-4 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Save size={18} />
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Channel;