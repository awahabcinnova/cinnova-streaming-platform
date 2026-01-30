import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import VideoCard from '../components/VideoCard';
import { Filter } from 'lucide-react';
import { Video } from '../types';

// Mock Data Generator
const generateSearchResults = (query: string): Video[] => {
  return Array.from({ length: 10 }).map((_, i) => ({
    id: `s${i}`,
    title: `${query} Tutorial #${i + 1}: The Ultimate Guide`,
    description: `This is a highly relevant video about ${query}. We dive deep into the topic and explain everything you need to know.`,
    thumbnail: `https://picsum.photos/seed/search${i}${query}/640/360`,
    url: "",
    views: Math.floor(Math.random() * 1000000),
    uploadedAt: `${Math.floor(Math.random() * 11) + 1} months ago`,
    duration: "15:45",
    tags: [query, "tutorial"],
    uploader: {
      id: `u${i}`,
      username: `Expert ${i + 1}`,
      avatar: `https://picsum.photos/seed/u${i}/100/100`,
      subscribers: 100000 * (i + 1)
    }
  }));
};

const SearchResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const results = useMemo(() => generateSearchResults(query), [query]);

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