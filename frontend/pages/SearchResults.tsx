import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import VideoCard from '../components/VideoCard';
import { Filter } from 'lucide-react';
import { Video } from '../types';
import { videoAPI } from '../api';

const SearchResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [allVideos, setAllVideos] = useState<Video[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await videoAPI.getAllVideos();
        if (alive) setAllVideos(Array.isArray(data) ? data : []);
      } catch {
        if (alive) setAllVideos([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allVideos;
    return allVideos.filter((v) => {
      const inTitle = (v.title || '').toLowerCase().includes(q);
      const inDesc = (v.description || '').toLowerCase().includes(q);
      const inUploader = (v.uploader?.username || '').toLowerCase().includes(q);
      const inTags = Array.isArray(v.tags) && v.tags.some((t) => String(t).toLowerCase().includes(q));
      return inTitle || inDesc || inUploader || inTags;
    });
  }, [allVideos, query]);

  return (
    <div className="max-w-5xl mx-auto pt-4">
      {/* Filters */}
      <div className="flex items-center gap-4 mb-6 border-b border-gray-100 pb-4 overflow-x-auto">
        <button className="flex items-center gap-2 px-4 py-1.5 border border-gray-300 rounded-full text-sm font-medium hover:bg-gray-50 flex-shrink-0">
          <Filter size={16} />
          Filters
        </button>
        {['All', 'Shorts', 'Videos', 'Unwatched', 'Recently uploaded', 'Live'].map((filter) => (
          <button
            key={filter}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === 'All' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {results.map((video) => (
          <VideoCard key={video.id} video={video} layout="row" />
        ))}
        {results.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500">No results found for "{query}".</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;