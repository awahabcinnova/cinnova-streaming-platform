import React, { useEffect, useState } from 'react';
import { ThumbsUp } from 'lucide-react';
import VideoCard from '../components/VideoCard';
import { Video } from '../types';
import { videoAPI } from '../api';

const LikedVideos: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await videoAPI.getLikedVideos();
        setVideos(Array.isArray(data) ? data : []);
      } catch {
        setVideos([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="max-w-6xl mx-auto pt-4">
      <div className="flex items-center gap-3 mb-6">
        <ThumbsUp size={22} className="text-gray-700" />
        <h1 className="text-2xl font-bold">Liked Videos</h1>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-gray-500">Loading...</div>
      ) : videos.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p>This list has no videos.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} layout="row" />
          ))}
        </div>
      )}
    </div>
  );
};

export default LikedVideos;
