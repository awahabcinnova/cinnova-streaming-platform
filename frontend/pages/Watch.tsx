import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, Share2, MoreHorizontal, User as UserIcon, Send } from 'lucide-react';
import VideoCard from '../components/VideoCard';
import { Video, Comment } from '../types';
import { useAuth } from '../context/AuthContext';

import { videoAPI, commentAPI, userAPI } from '../api';

const BACKEND_BASE_URL = '';

const Watch: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [video, setVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const fetchVideoData = async () => {
      if (id) {
        try {
          // Fetch video data
          const videoData = await videoAPI.getVideoById(id);
          setVideo(videoData);

          // Fetch comments for this video
          const commentsData = await commentAPI.getComments(id);
          setComments(commentsData);

          // Track view only once per user per session
          const viewedKey = `viewed_video_${id}_user_${user?.id || 'guest'}`;
          if (!sessionStorage.getItem(viewedKey)) {
            await videoAPI.trackView(id);
            sessionStorage.setItem(viewedKey, '1');
          }

          // Scroll to top
          window.scrollTo(0, 0);
        } catch (error) {
          console.error('Error fetching video data:', error);
        }
      }
    };

    fetchVideoData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !id) return;

    try {
      // Submit comment to backend
      const commentResponse = await commentAPI.createComment(id, '1', newComment);

      // Add the new comment to the list
      setComments([commentResponse, ...comments]);
      setNewComment('');
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  if (!video) return <div className="p-8 text-center">Loading video...</div>;

  return (
    <div className="max-w-[1800px] mx-auto flex flex-col lg:flex-row gap-6">
      {/* Main Column */}
      <div className="flex-1">
        {/* Video Player Container */}
        <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg relative group">
          <video
            src={video.url.startsWith('/media/') ? BACKEND_BASE_URL + video.url : video.url}
            className="w-full h-full object-contain"
            controls
            autoPlay
            muted // Muted for autoplay policy
          />
        </div>

        {/* Video Info */}
        <div className="mt-4">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{video.title}</h1>

          <div className="flex flex-col md:flex-row md:items-center justify-between mt-3 gap-4">
            <div className="flex items-center gap-4">
              <img src={video.uploader.avatar} alt={video.uploader.username} className="w-10 h-10 rounded-full" />
              <div>
                <h3 className="font-semibold text-gray-900">{video.uploader.username}</h3>
                <p className="text-xs text-gray-500">{video.uploader.subscribers.toLocaleString()} subscribers</p>
              </div>
              <button className="bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors ml-4">
                Subscribe
              </button>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              <button className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-full text-sm font-medium h-9">
                <Share2 size={18} />
                Share
              </button>

              <button className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 w-9 h-9 rounded-full">
                <MoreHorizontal size={18} />
              </button>
            </div>
          </div>

          <div className="mt-4 bg-gray-100 rounded-xl p-3 text-sm">
            <div className="flex justify-between items-start mb-2">
              <div className="font-medium">
                {video.views.toLocaleString()} views • {video.uploadedAt}
              </div>
            </div>

            <p className="whitespace-pre-wrap text-gray-800">{video.description}</p>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">{comments.length} Comments</h3>
          </div>

          <form onSubmit={handleCommentSubmit} className="flex gap-4 mb-8">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center">
              <UserIcon className="text-gray-500" />
            </div>
            <div className="flex-1">
              <input
                type="text"
                placeholder="Add a comment..."
                className="w-full border-b border-gray-300 focus:border-black focus:outline-none pb-1 transition-colors bg-transparent"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
                >
                  Comment
                </button>
              </div>
            </div>
          </form>

          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex-shrink-0 text-white flex items-center justify-center font-bold text-sm">
                  {comment.username[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{comment.username}</span>
                    <span className="text-xs text-gray-500">{comment.timestamp}</span>
                  </div>
                  <p className="text-sm text-gray-800">{comment.text}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-black">
                      <ThumbsUp size={14} />
                      {comment.likes}
                    </button>
                    <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-black">
                      <ThumbsDown size={14} />
                    </button>
                    <button className="text-xs font-medium text-gray-500 hover:text-black">Reply</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar Recommendations */}
      {/* Up Next sidebar removed as requested */}
    </div>
  );
};

export default Watch;