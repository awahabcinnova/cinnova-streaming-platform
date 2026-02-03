import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import VideoCard from '../components/VideoCard';
import { Video, User } from '../types';
import { videoAPI, userAPI } from '../api';
import { resolveMediaUrl } from '../utils/media';

const SearchResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const filter = (searchParams.get('filter') || 'all').toLowerCase();

  const [videoResults, setVideoResults] = useState<Video[]>([]);
  const [userResults, setUserResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setVideoResults([]);
      setUserResults([]);
      return;
    }
    let alive = true;
    setIsLoading(true);
    (async () => {
      try {
        const [videosData, usersData] = await Promise.all([
          videoAPI.searchVideos(q),
          userAPI.searchUsers(q),
        ]);
        if (!alive) return;
        setVideoResults(Array.isArray(videosData) ? videosData : []);
        setUserResults(Array.isArray(usersData) ? usersData : []);
      } catch {
        if (!alive) return;
        setVideoResults([]);
        setUserResults([]);
      } finally {
        if (alive) setIsLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [query]);

  const setFilter = (next: 'all' | 'users' | 'videos') => {
    const params = new URLSearchParams(searchParams);
    params.set('filter', next);
    if (!params.get('q')) {
      params.set('q', query);
    }
    window.history.replaceState({}, '', `#/results?${params.toString()}`);
  };

  return (
    <div className="max-w-5xl mx-auto pt-4">
      {/* Filters */}
      <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4 overflow-x-auto">
        {[
          { key: 'all', label: 'All' },
          { key: 'users', label: 'Users' },
          { key: 'videos', label: 'Videos' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as 'all' | 'users' | 'videos')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === f.key ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-20 text-gray-500">Loading...</div>
        ) : null}

        {!isLoading && (filter === 'all' || filter === 'users') && (
          <div className="space-y-3">
            {userResults.map((u) => (
              <Link
                key={u.id}
                to={`/user/${u.id}`}
                className="flex items-center gap-4 rounded-xl border border-gray-200 p-4 hover:bg-gray-50"
              >
                <img src={resolveMediaUrl(u.avatar)} alt={u.username} className="w-12 h-12 rounded-full" />
                <div>
                  <div className="font-semibold text-gray-900">{u.username}</div>
                  <div className="text-xs text-gray-500">{u.subscribers.toLocaleString()} subscribers</div>
                </div>
              </Link>
            ))}
            {filter === 'users' && userResults.length === 0 ? (
              <div className="text-center py-16 text-gray-500">No users found for "{query}".</div>
            ) : null}
          </div>
        )}

        {!isLoading && (filter === 'all' || filter === 'videos') && (
          <div className="space-y-4">
            {videoResults.map((video) => (
              <VideoCard key={video.id} video={video} layout="row" />
            ))}
            {filter === 'videos' && videoResults.length === 0 ? (
              <div className="text-center py-16 text-gray-500">No videos found for "{query}".</div>
            ) : null}
          </div>
        )}

        {!isLoading && filter === 'all' && videoResults.length === 0 && userResults.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500">No results found for "{query}".</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
