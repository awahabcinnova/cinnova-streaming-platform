import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, Share2, MoreHorizontal, User as UserIcon } from 'lucide-react';
import { Video, Comment } from '../types';
import { useAuth } from '../context/AuthContext';
import { resolveMediaUrl } from '../utils/media';

import { videoAPI, commentAPI, subscriptionAPI } from '../api';

const Watch: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [video, setVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const [visibleRepliesCount, setVisibleRepliesCount] = useState<Record<string, number>>({});
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const trackingViewRef = useRef<Record<string, boolean>>({});
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubBusy, setIsSubBusy] = useState(false);
  const [likeCount, setLikeCount] = useState<number | null>(null);
  const [dislikeCount, setDislikeCount] = useState<number | null>(null);
  const [reaction, setReaction] = useState<'like' | 'dislike' | null>(null);
  const [isReactionBusy, setIsReactionBusy] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const reactionBusyRef = useRef(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareLink, setShareLink] = useState('');

  type ThreadedComment = Comment & { replies: ThreadedComment[] };

  const buildThread = (items: Comment[]): ThreadedComment[] => {
    const byId = new Map<string, ThreadedComment>();
    const roots: ThreadedComment[] = [];

    for (const c of items) {
      byId.set(c.id, { ...c, replies: [] });
    }

    for (const c of byId.values()) {
      const pid = c.parentId;
      if (pid && byId.has(pid)) {
        byId.get(pid)!.replies.push(c);
      } else {
        roots.push(c);
      }
    }

    return roots;
  };

  useEffect(() => {
    const fetchVideoData = async () => {
      if (id) {
        try {
          const videoData = await videoAPI.getVideoById(id);
          setVideo(videoData);
          setSubscriberCount(videoData?.uploader?.subscribers ?? 0);
          setLikeCount(videoData?.likes ?? 0);
          setDislikeCount(videoData?.dislikes ?? 0);
          setReaction(videoData?.viewerReaction ?? null);

          const commentsData = await commentAPI.getComments(id);
          setComments(commentsData);

          if (user?.id) {
            const viewedKey = `viewed_video_${id}_user_${user.id}`;
            if (!sessionStorage.getItem(viewedKey) && !trackingViewRef.current[viewedKey]) {
              trackingViewRef.current[viewedKey] = true;
              sessionStorage.setItem(viewedKey, '1');
              try {
                await videoAPI.trackView(id);
              } catch (error) {
                sessionStorage.removeItem(viewedKey);
                trackingViewRef.current[viewedKey] = false;
                throw error;
              }
            }
          }

          window.scrollTo(0, 0);
        } catch (error) {
          console.error('Error fetching video data:', error);
        }
      }
    };

    fetchVideoData();
  }, [id, user?.id]);

  useEffect(() => {
    if (!video?.uploader?.id) return;
    const loadSubscribers = async () => {
      try {
        const data = await subscriptionAPI.getSubscribers(video.uploader.id);
        const list = Array.isArray(data?.subscribers) ? data.subscribers : [];
        const count = typeof data?.count === 'number' ? data.count : list.length;
        setSubscriberCount(count);
        if (user?.id) {
          setIsSubscribed(list.includes(user.id));
        } else {
          setIsSubscribed(false);
        }
      } catch {
        if (typeof video?.uploader?.subscribers === 'number') {
          setSubscriberCount(video.uploader.subscribers);
        }
      }
    };
    loadSubscribers();
  }, [video?.uploader?.id, user?.id]);

  const handleSubscribeToggle = async () => {
    if (!user?.id || !video?.uploader?.id) return;
    if (user.id === video.uploader.id) return;
    if (isSubBusy) return;
    setIsSubBusy(true);
    try {
      if (isSubscribed) {
        await subscriptionAPI.unsubscribe(video.uploader.id, user.id);
        setIsSubscribed(false);
        setSubscriberCount((c) => Math.max(0, (c ?? video.uploader.subscribers) - 1));
      } else {
        await subscriptionAPI.subscribe(video.uploader.id, user.id);
        setIsSubscribed(true);
        setSubscriberCount((c) => (c ?? video.uploader.subscribers) + 1);
      }
    } finally {
      setIsSubBusy(false);
    }
  };

  const applyReactionFromResponse = (resp: any) => {
    if (resp && typeof resp.reaction !== 'undefined') {
      setReaction(resp.reaction ?? null);
    }
    if (resp && typeof resp.likes === 'number') {
      setLikeCount(resp.likes);
    }
    if (resp && typeof resp.dislikes === 'number') {
      setDislikeCount(resp.dislikes);
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 2000);
  };

  const openShare = () => {
    if (!id) return;
    const link = `${window.location.origin}/watch/${id}`;
    setShareLink(link);
    setIsShareOpen(true);
  };

  const closeShare = () => {
    setIsShareOpen(false);
  };

  const handleCopyLink = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      showToast('Link copied');
    } catch {
      showToast('Failed to copy link');
    }
  };

  const handleNativeShare = async () => {
    if (!shareLink) return;
    if (!navigator.share) {
      showToast('Share not supported on this device');
      return;
    }
    try {
      await navigator.share({
        title: video?.title || 'Video',
        text: video?.title || 'Watch this video',
        url: shareLink,
      });
    } catch {
    }
  };

  const handleLikeToggle = async () => {
    if (!user?.id || !id) {
      showToast('Login required to like videos');
      return;
    }
    if (reactionBusyRef.current) return;
    reactionBusyRef.current = true;
    setIsReactionBusy(true);
    try {
      const resp = await videoAPI.likeVideo(id);
      applyReactionFromResponse(resp);
    } finally {
      reactionBusyRef.current = false;
      setIsReactionBusy(false);
    }
  };

  const handleDislikeToggle = async () => {
    if (!user?.id || !id) {
      showToast('Login required to dislike videos');
      return;
    }
    if (reactionBusyRef.current) return;
    reactionBusyRef.current = true;
    setIsReactionBusy(true);
    try {
      const resp = await videoAPI.dislikeVideo(id);
      applyReactionFromResponse(resp);
    } finally {
      reactionBusyRef.current = false;
      setIsReactionBusy(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !id) return;
    if (!user?.id) return;

    try {
      const commentResponse = await commentAPI.createComment(id, newComment, null);

      setComments((prev) => [commentResponse, ...prev]);
      setNewComment('');
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyToId || !replyText.trim() || !id) return;
    if (!user?.id) return;

    try {
      const created = await commentAPI.createComment(id, replyText, replyToId);
      setComments((prev) => [...prev, created]);
      setReplyText('');
      setReplyToId(null);
    } catch (error) {
      console.error('Error submitting reply:', error);
    }
  };

  const threaded = buildThread(comments);

  const removeCommentFromState = (commentId: string) => {
    setComments((prev) => {
      const childrenByParent = new Map<string, string[]>();
      for (const c of prev) {
        if (c.parentId) {
          const arr = childrenByParent.get(c.parentId) ?? [];
          arr.push(c.id);
          childrenByParent.set(c.parentId, arr);
        }
      }

      const toDelete = new Set<string>();
      const stack: string[] = [commentId];
      while (stack.length) {
        const cur = stack.pop()!;
        if (toDelete.has(cur)) continue;
        toDelete.add(cur);
        const kids = childrenByParent.get(cur) ?? [];
        for (const k of kids) stack.push(k);
      }

      return prev.filter((c) => !toDelete.has(c.id));
    });
  };

  const CommentNode: React.FC<{ node: ThreadedComment; depth: number }> = ({ node, depth }) => (
    <div className={depth > 0 ? 'ml-12 mt-4' : ''}>
      <div className="flex gap-4">
        {node.avatar ? (
          <img
            src={resolveMediaUrl(node.avatar)}
            alt={node.username}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex-shrink-0 text-white flex items-center justify-center font-bold text-sm">
            {node.username[0]}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Link to={`/user/${node.userId}`} className="font-semibold text-sm hover:underline">
              {node.username}
            </Link>
            <span className="text-xs text-gray-500">{node.timestamp}</span>
          </div>
          {editingCommentId === node.id ? (
            <form
              className="mt-1"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!editingText.trim()) return;
                try {
                  const updated = await commentAPI.updateComment(node.id, editingText);
                  setComments((prev) => prev.map((c) => (c.id === node.id ? { ...c, text: updated.text } : c)));
                  setEditingCommentId(null);
                  setEditingText('');
                } catch (error) {
                  console.error('Error updating comment:', error);
                }
              }}
            >
              <input
                type="text"
                className="w-full border-b border-gray-300 focus:border-black focus:outline-none pb-1 transition-colors bg-transparent text-sm"
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
              />
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={!editingText.trim()}
                  className="text-xs font-medium text-blue-600 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  type="button"
                  className="text-xs font-medium text-gray-500 hover:text-black"
                  onClick={() => {
                    setEditingCommentId(null);
                    setEditingText('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-gray-800">{node.text}</p>
          )}
          <div className="flex items-center gap-4 mt-2">
            <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-black">
              <ThumbsUp size={14} />
              {node.likes}
            </button>
            <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-black">
              <ThumbsDown size={14} />
            </button>
            <button
              type="button"
              className="text-xs font-medium text-gray-500 hover:text-black"
              onClick={() => {
                setReplyToId(node.id);
                setReplyText('');
              }}
            >
              Reply
            </button>

            {node.replies?.length ? (
              <button
                type="button"
                className="text-xs font-medium text-blue-600"
                onClick={() => {
                  setExpandedReplies((prev) => ({
                    ...prev,
                    [node.id]: !prev[node.id],
                  }));
                  setVisibleRepliesCount((prev) => ({
                    ...prev,
                    [node.id]: prev[node.id] ?? 5,
                  }));
                }}
              >
                {expandedReplies[node.id] ? 'Hide replies' : `View replies (${node.replies.length})`}
              </button>
            ) : null}

            {user?.id && user.id === node.userId ? (
              <>
                <button
                  type="button"
                  className="text-xs font-medium text-gray-500 hover:text-black"
                  onClick={() => {
                    setEditingCommentId(node.id);
                    setEditingText(node.text);
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="text-xs font-medium text-red-600"
                  onClick={async () => {
                    try {
                      await commentAPI.deleteComment(node.id);
                      removeCommentFromState(node.id);
                    } catch (error) {
                      console.error('Error deleting comment:', error);
                    }
                  }}
                >
                  Delete
                </button>
              </>
            ) : null}
          </div>

          {replyToId === node.id ? (
            <form onSubmit={handleReplySubmit} className="mt-3 flex gap-3">
              <input
                type="text"
                placeholder="Write a reply..."
                className="flex-1 border-b border-gray-300 focus:border-black focus:outline-none pb-1 transition-colors bg-transparent text-sm"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <button
                type="submit"
                disabled={!replyText.trim()}
                className="text-sm font-medium text-blue-600 disabled:opacity-50"
              >
                Reply
              </button>
            </form>
          ) : null}

          {node.replies?.length && expandedReplies[node.id] ? (
            <div className={depth === 0 ? 'mt-3' : 'mt-2'}>
              <div>
                {node.replies
                  .slice(0, visibleRepliesCount[node.id] ?? 5)
                  .map((r) => (
                    <CommentNode key={r.id} node={r} depth={depth + 1} />
                  ))}
              </div>

              {(visibleRepliesCount[node.id] ?? 5) < node.replies.length ? (
                <button
                  type="button"
                  className="ml-12 mt-2 text-xs font-medium text-blue-600"
                  onClick={() =>
                    setVisibleRepliesCount((prev) => ({
                      ...prev,
                      [node.id]: (prev[node.id] ?? 5) + 5,
                    }))
                  }
                >
                  View more replies
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (!video) return <div className="p-8 text-center">Loading video...</div>;

  return (
    <div className="max-w-[1800px] mx-auto flex flex-col lg:flex-row gap-6 relative">
      <div className="flex-1">
        <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg relative group">
          <video
            src={resolveMediaUrl(video.url)}
            className="w-full h-full object-contain"
            controls
            autoPlay
            muted
          />
        </div>

        <div className="mt-4">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{video.title}</h1>

          <div className="flex flex-col md:flex-row md:items-center justify-between mt-3 gap-4">
            <div className="flex items-center gap-4">
              <Link to={`/user/${video.uploader.id}`}>
                <img
                  src={resolveMediaUrl(video.uploader.avatar)}
                  alt={video.uploader.username}
                  className="w-10 h-10 rounded-full"
                />
              </Link>
              <div>
                <Link to={`/user/${video.uploader.id}`} className="font-semibold text-gray-900 hover:underline">
                  {video.uploader.username}
                </Link>
                <p className="text-xs text-gray-500">
                  {(subscriberCount ?? video.uploader.subscribers).toLocaleString()} subscribers
                </p>
              </div>
              <button
                type="button"
                disabled={!user?.id || user.id === video.uploader.id || isSubBusy}
                onClick={handleSubscribeToggle}
                className={
                  `px-4 py-2 rounded-full text-sm font-medium transition-colors ml-4 ` +
                  (isSubscribed
                    ? 'bg-white text-black border border-black hover:bg-gray-100'
                    : 'bg-black text-white hover:bg-gray-800') +
                  (!user?.id || user?.id === video.uploader.id ? ' opacity-50 cursor-not-allowed' : '')
                }
              >
                {isSubscribed ? 'Subscribed' : 'Subscribe'}
              </button>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              <div className="flex items-center bg-gray-100 rounded-full h-9">
                <button
                  type="button"
                  disabled={!user?.id || isReactionBusy}
                  onClick={handleLikeToggle}
                  className={
                    `flex items-center gap-2 px-4 h-9 rounded-l-full text-sm font-medium transition-colors ` +
                    (reaction === 'like' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-200') +
                    (!user?.id ? ' opacity-50 cursor-not-allowed' : '')
                  }
                >
                  <ThumbsUp size={18} />
                  {(likeCount ?? video.likes).toLocaleString()}
                </button>
                <div className="w-px h-5 bg-gray-300" />
                <button
                  type="button"
                  disabled={!user?.id || isReactionBusy}
                  onClick={handleDislikeToggle}
                  className={
                    `flex items-center gap-2 px-4 h-9 rounded-r-full text-sm font-medium transition-colors ` +
                    (reaction === 'dislike' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-200') +
                    (!user?.id ? ' opacity-50 cursor-not-allowed' : '')
                  }
                >
                  <ThumbsDown size={18} />
                  {(dislikeCount ?? video.dislikes).toLocaleString()}
                </button>
              </div>
              <button
                type="button"
                onClick={openShare}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-full text-sm font-medium h-9"
              >
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
            {threaded.map((node) => (
              <CommentNode key={node.id} node={node} depth={0} />
            ))}
          </div>
        </div>
      </div>

      {isShareOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Share</h3>
              <button
                type="button"
                onClick={closeShare}
                className="text-sm font-medium text-gray-500 hover:text-black"
              >
                Close
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-500">Link</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="rounded-lg bg-black px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  Share via device
                </button>
                <a
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-center text-sm font-medium hover:bg-gray-50"
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Facebook
                </a>
              </div>
              <div className="flex items-center gap-2">
                <a
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-center text-sm font-medium hover:bg-gray-50"
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(video?.title || 'Watch this video')}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  X (Twitter)
                </a>
                <a
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-center text-sm font-medium hover:bg-gray-50"
                  href={`https://wa.me/?text=${encodeURIComponent((video?.title || 'Watch this video') + ' ' + shareLink)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {toastMessage ? (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-black text-white px-4 py-2 rounded-full text-sm shadow-lg">
          {toastMessage}
        </div>
      ) : null}
    </div>
  );
};

export default Watch;
