import React, { useState, useEffect } from 'react';
import { Trash2, PauseCircle, Search, Settings, X } from 'lucide-react';
import VideoCard from '../components/VideoCard';
import { Video } from '../types';
import { useAuth } from '../context/AuthContext';
import { videoAPI } from '../api';

const History: React.FC = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<Video[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const watchedKeyPrefix = user?.id ? `viewed_video_` : `viewed_video_`;
    const watchedIds: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(watchedKeyPrefix) && key.includes(`user_${user?.id || 'guest'}`)) {
        const parts = key.split('_');
        const videoId = parts[2];
        if (videoId) watchedIds.push(videoId);
      }
    }
    const fetchWatchedVideos = async () => {
      const videos: Video[] = [];
      for (const vid of watchedIds) {
        try {
          const v = await videoAPI.getVideoById(vid);
          if (v && v.id) videos.push(v);
        } catch { }
      }
      setHistory(videos);
    };
    if (watchedIds.length > 0) fetchWatchedVideos();
    else setHistory([]);
  }, [user?.id]);

  const filteredHistory = history.filter(v =>
    v.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const clearHistory = () => {
    if (window.confirm("Are you sure you want to clear your entire watch history?")) {
      const watchedKeyPrefix = `viewed_video_`;
      const userSuffix = `user_${user?.id || 'guest'}`;
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(watchedKeyPrefix) && key.includes(userSuffix)) {
          keysToRemove.push(key);
        }
      }
      for (const k of keysToRemove) {
        sessionStorage.removeItem(k);
      }
      setHistory([]);
    }
  };

  const removeItem = (id: string) => {
    const key = `viewed_video_${id}_user_${user?.id || 'guest'}`;
    sessionStorage.removeItem(key);
    setHistory(history.filter(v => v.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto pt-4">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">Watch History</h1>
          <button
            onClick={clearHistory}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Clear History
          </button>
        </div>
        {history.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p>This list has no videos.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((video) => (
              <div key={video.id} className="relative group">
                <VideoCard video={video} layout="row" />
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    removeItem(video.id);
                  }}
                  className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  title="Remove from history"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>


    </div>
  );
};

export default History;