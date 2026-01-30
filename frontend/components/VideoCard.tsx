import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { Video } from '../types';
import { CheckCircle } from 'lucide-react';

interface VideoCardProps {
  video: Video;
  layout?: 'grid' | 'row';
}

const BACKEND_BASE_URL = '';

const VideoCard: React.FC<VideoCardProps> = ({ video, layout = 'grid' }) => {
  if (layout === 'row') {
    const thumbSrc = video.thumbnail && video.thumbnail.startsWith('/media/')
      ? BACKEND_BASE_URL + video.thumbnail
      : video.thumbnail || null;
    return (
      <Link to={`/watch/${video.id}`} className="flex gap-4 group mb-4 w-full">
        <div className="relative w-40 min-w-[160px] aspect-video rounded-xl overflow-hidden bg-gray-200">
          {thumbSrc ? (
            <img
              src={thumbSrc}
              alt={video.title}
              loading="lazy"
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
            />
          ) : null}
          <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
            {video.duration}
          </span>
        </div>
        <div className="flex flex-col">
          <h3 className="font-semibold text-sm line-clamp-2 leading-tight mb-1 text-gray-900 group-hover:text-blue-600">
            {video.title}
          </h3>
          <div className="text-xs text-gray-600 flex items-center mb-1">
            {video.uploader.username}
            <CheckCircle size={12} className="ml-1 text-gray-400" />
          </div>
          <div className="text-xs text-gray-600">
            {video.views.toLocaleString()} views • {video.uploadedAt}
          </div>
        </div>
      </Link>
    );
  }

  const thumbSrc = video.thumbnail && video.thumbnail.startsWith('/media/')
    ? BACKEND_BASE_URL + video.thumbnail
    : video.thumbnail || null;
  return (
    <Link to={`/watch/${video.id}`} className="group flex flex-col gap-3">
      <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-200">
        {thumbSrc ? (
          <img
            src={thumbSrc}
            alt={video.title}
            loading="lazy"
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
          />
        ) : null}
        <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
          {video.duration}
        </span>
      </div>
      <div className="flex gap-3 items-start">
        <img
          src={video.uploader.avatar}
          alt={video.uploader.username}
          loading="lazy"
          className="w-9 h-9 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <h3 className="font-semibold text-base line-clamp-2 leading-tight mb-1 text-gray-900">
            {video.title}
          </h3>
          <div className="text-sm text-gray-600 flex items-center">
            {video.uploader.username}
            <CheckCircle size={14} className="ml-1 text-gray-400" />
          </div>
          <div className="text-sm text-gray-600">
            {video.views.toLocaleString()} views • {video.uploadedAt}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default memo(VideoCard);