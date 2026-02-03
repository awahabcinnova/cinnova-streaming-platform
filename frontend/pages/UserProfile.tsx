import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Video, User } from '../types';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/VideoCard';
import { subscriptionAPI, userAPI, videoAPI } from '../api';
import { resolveMediaUrl } from '../utils/media';

const UserProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
  const [isSubBusy, setIsSubBusy] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const data = await userAPI.getUser(id);
        setProfile(data);
        setSubscriberCount(typeof data?.subscribers === 'number' ? data.subscribers : 0);
      } catch {
        setProfile(null);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const loadVideos = async () => {
      try {
        const data = await videoAPI.getVideosByUser(id);
        setVideos(Array.isArray(data) ? data : []);
      } catch {
        setVideos([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadVideos();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const loadSubscribers = async () => {
      try {
        const data = await subscriptionAPI.getSubscribers(id);
        const list = Array.isArray(data?.subscribers) ? data.subscribers : [];
        const count = typeof data?.count === 'number' ? data.count : list.length;
        setSubscriberCount(count);
        if (user?.id) {
          setIsSubscribed(list.includes(user.id));
        } else {
          setIsSubscribed(false);
        }
      } catch {
      }
    };
    loadSubscribers();
  }, [id, user?.id]);

  const handleSubscribeToggle = async () => {
    if (!user?.id || !id) return;
    if (user.id === id) return;
    if (isSubBusy) return;
    setIsSubBusy(true);
    try {
      if (isSubscribed) {
        await subscriptionAPI.unsubscribe(id, user.id);
        setIsSubscribed(false);
        setSubscriberCount((c) => Math.max(0, (c ?? 0) - 1));
      } else {
        await subscriptionAPI.subscribe(id, user.id);
        setIsSubscribed(true);
        setSubscriberCount((c) => (c ?? 0) + 1);
      }
    } finally {
      setIsSubBusy(false);
    }
  };

  if (!profile && !isLoading) {
    return <div className="max-w-6xl mx-auto pt-4">User not found.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto pt-4 space-y-6">
      <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
        <div className="h-32 md:h-48 bg-gradient-to-r from-slate-800 to-slate-600 relative">
          {profile?.banner ? (
            <img src={resolveMediaUrl(profile.banner)} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
          ) : null}
        </div>
        <div className="px-6 pb-6">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-10">
            <div className="relative">
              <img
                src={resolveMediaUrl(profile?.avatar)}
                alt={profile?.username}
                className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-md bg-white object-cover"
              />
            </div>

            <div className="flex-1 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{profile?.username}</h1>
              <div className="text-gray-500 text-sm flex items-center gap-2 mt-1">
                <span>@{profile?.username?.toLowerCase()}</span>
                <span>•</span>
                <span>{(subscriberCount ?? 0).toLocaleString()} subscribers</span>
                <span>•</span>
                <span>{videos.length} videos</span>
              </div>
            </div>

            <button
              type="button"
              disabled={!user?.id || user.id === id || isSubBusy}
              onClick={handleSubscribeToggle}
              className={
                `px-4 py-2 rounded-full text-sm font-medium transition-colors ` +
                (isSubscribed
                  ? 'bg-white text-black border border-black hover:bg-gray-100'
                  : 'bg-black text-white hover:bg-gray-800') +
                (!user?.id || user?.id === id ? ' opacity-50 cursor-not-allowed' : '')
              }
            >
              {isSubscribed ? 'Subscribed' : 'Subscribe'}
            </button>
          </div>
        </div>
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

export default UserProfile;
