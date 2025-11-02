import {
  BadgeCheck,
  Heart,
  MessageCircle,
  Share2,
  Send,
  Reply,
  Trash2Icon,
} from 'lucide-react';
import { useState } from 'react';
import moment from 'moment';
import API from '../api/api';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const PostCard = ({ post }) => {
  const postWithHashtags = post.text.replace(
    /(#\w+)/g,
    '<span class="text-indigo-600">$1</span>'
  );

  const [likes, setLikes] = useState(post.likes || []);
  const [shares, setShares] = useState(post.shares || []);
  const [comments, setComments] = useState(post.comments || []);
  const [commentCount, setCommentCount] = useState(
    post.comments ? post.comments.length : 0
  );
  const [newComment, setNewComment] = useState('');
  const [newReply, setNewReply] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [replyingToCommentId, setReplyingToCommentId] = useState(null);

  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  /* ------------------------------------------------------------------ */
  /*                           API HANDLERS                           */
  /* ------------------------------------------------------------------ */
  const handleLike = async (postId) => {
    try {
      const res = await API.put(
        `/post/likepost/${postId}`,
        {},
        { withCredentials: true }
      );
      setLikes(res.data.post.likes);
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await API.post(
        `/post/${post._id}/comments`,
        { text: newComment },
        { withCredentials: true }
      );
      const newComm = res.data.comment;
      setComments([...comments, newComm]);
      setCommentCount(commentCount + 1);
      setNewComment('');
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const handleAddReply = async (commentId) => {
    if (!newReply.trim()) return;
    try {
      const res = await API.post(
        `/post/${post._id}/comments/${commentId}/replies`,
        { text: newReply },
        { withCredentials: true }
      );
      const newRep = res.data.reply;
      setComments((prev) =>
        prev.map((c) =>
          c._id === commentId ? { ...c, replies: [...c.replies, newRep] } : c
        )
      );
      setNewReply('');
      setReplyingToCommentId(null);
    } catch (err) {
      console.error('Error adding reply:', err);
    }
  };

  const handleRepost = async () => {
    try {
      const res = await API.post(
        `/post/${post._id}/share`,
        {},
        { withCredentials: true }
      );
      setShares(res.data.post.shares);
    } catch (err) {
      console.error('Error reposting:', err);
    }
  };

  const handlePostDelete = async () => {
    try {
      await API.delete(`/post/deletepost/${post._id}`, {
        withCredentials: true,
      });
      window.location.reload();
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  const handleExternalShare = async () => {
    const shareData = {
      title: 'Check out this post!',
      text: post.text || `A post from ${post.userId.fullname}`,
      url: `${window.location.origin}/post/${post._id}`,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert('Post link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
      alert(`Sharing not supported. Post link: ${shareData.url}`);
    }
  };

  const handleToggleComments = () => setShowComments((s) => !s);

  /* ------------------------------------------------------------------ */
  /*                         OWNERSHIP CHECK                           */
  /* ------------------------------------------------------------------ */
  const isOwnPost =
    currentUser &&
    post.userId &&
    (currentUser._id === post.userId._id ||
      currentUser._id === post.userId);

  /* ------------------------------------------------------------------ */
  /*                         STOP PROPAGATION HELPER                  */
  /* ------------------------------------------------------------------ */
  const stopProp = (fn) => (e) => {
    e.stopPropagation();
    fn();
  };

  /* ------------------------------------------------------------------ */
  /*                               RENDER                               */
  /* ------------------------------------------------------------------ */
  return (
    <div
      onClick={() => navigate(`/post/${post._id}`)}
      className="bg-white rounded-xl shadow p-4 w-full max-w-2xl cursor-pointer"
    >
      {/* -------------------- USER INFO -------------------- */}
      <div
        onClick={stopProp(() => navigate(`/profile/${post.userId._id}`))}
        className="inline-flex items-center gap-3 cursor-pointer"
      >
        <img
          src={
            post.userId?.profilePics ||
            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200'
          }
          alt=""
          className="w-10 h-10 rounded-full shadow"
        />
        <div>
          <div className="flex items-center space-x-1">
            <span>{post.userId?.fullname || 'Mr.Nepal'}</span>
            <BadgeCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-gray-500 text-sm">
            @{post.userId?.username || 'Mr.Nepal'} •{' '}
            {moment(post.createdAt).fromNow()}
          </div>
        </div>
      </div>

      {/* -------------------- POST TEXT -------------------- */}
      {post.text && (
        <div
          className="text-gray-800 text-sm whitespace-pre-line mt-2"
          dangerouslySetInnerHTML={{ __html: postWithHashtags }}
        />
      )}

      {/* -------------------- IMAGES -------------------- */}
      <div className="grid grid-cols-2 gap-2 mt-2">
        {post.image.map((img, index) => (
          <img
            src={img}
            key={index}
            className={`w-full h-48 object-cover rounded-lg ${
              post.image.length === 1 && 'col-span-2 h-auto'
            }`}
            alt=""
          />
        ))}
      </div>

      {/* -------------------- ACTIONS BAR -------------------- */}
      <div className="flex items-center gap-4 text-gray-600 text-sm pt-2 border-t border-gray-300 mt-2">
        {/* LIKE */}
        <div className="flex items-center gap-1">
          <Heart
            className={`w-4 h-4 cursor-pointer ${
              likes.includes(currentUser?._id) && 'text-red-500 fill-red-500'
            }`}
            onClick={stopProp(() => handleLike(post._id))}
          />
          <span>{likes.length}</span>
        </div>

        {/* COMMENT TOGGLE */}
        <div className="flex items-center gap-1">
          <MessageCircle
            className="w-4 h-4 cursor-pointer"
            onClick={stopProp(handleToggleComments)}
          />
          <span>{commentCount}</span>
        </div>

        {/* SHARE (external) */}
        <div className="flex items-center gap-1">
          <Share2
            className="w-4 h-4 cursor-pointer"
            onClick={stopProp(handleExternalShare)}
          />
        </div>

        {/* DELETE (own post) */}
        {isOwnPost && (
          <div className="ml-auto">
            <Trash2Icon
              className="flex items-center cursor-pointer gap-1 text-red-600 hover:underline"
              onClick={stopProp(handlePostDelete)}
            />
          </div>
        )}
      </div>

      {/* -------------------- COMMENTS SECTION -------------------- */}
      {showComments && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Comments
          </h3>

          {comments.length === 0 ? (
            <p className="text-sm text-gray-500">
              No comments yet. Be the first!
            </p>
          ) : (
            <div className="space-y-4 max-h-60 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment._id} className="flex items-start gap-2">
                  {/* comment avatar */}
                  <img
                    src={
                      comment.userId?.profilePics || comment.userId?.profile_picture ||
                      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200'
                    }
                    alt=""
                    className="w-8 h-8 rounded-full shadow"
                  />
                  <div className="flex-1">
                    {/* comment bubble */}
                    <div className="bg-gray-100 rounded-lg p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-800">
                          {comment.userId?.fullname || 'Anonymous'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {moment(comment.createdAt).fromNow()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.text}</p>
                    </div>

                    {/* REPLY LINK */}
                    <p
                      className="text-xs text-indigo-600 cursor-pointer mt-1"
                      onClick={stopProp(() =>
                        setReplyingToCommentId(
                          replyingToCommentId === comment._id
                            ? null
                            : comment._id
                        )
                      )}
                    >
                      Reply
                    </p>

                    {/* REPLIES */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="ml-8 space-y-2 mt-2">
                        {comment.replies.map((reply) => (
                          <div
                            key={reply._id}
                            className="flex items-start gap-2"
                          >
                            <img
                              src={
                                reply.userId?.profilePics ||
                                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200'
                              }
                              alt=""
                              className="w-6 h-6 rounded-full shadow"
                            />
                            <div className="bg-gray-50 rounded-lg p-2 flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-800">
                                  {reply.userId?.fullname || 'Anonymous'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {moment(reply.createdAt).fromNow()}
                                </span>
                              </div>
                              <p className="text-xs text-gray-700">
                                {reply.text}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* REPLY INPUT */}
                    {replyingToCommentId === comment._id && (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Add a reply..."
                          className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
                          value={newReply}
                          onChange={(e) => setNewReply(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.stopPropagation();
                              handleAddReply(comment._id);
                            }
                          }}
                        />
                        <button
                          onClick={stopProp(() =>
                            handleAddReply(comment._id)
                          )}
                          className="bg-indigo-600 text-white rounded-full p-2 hover:bg-indigo-700 transition"
                          disabled={!newReply.trim()}
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ADD COMMENT INPUT */}
          <div className="mt-4 flex items-center gap-2">
            <input
              type="text"
              placeholder="Add a comment..."
              className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.stopPropagation();
                  handleAddComment();
                }
              }}
            />
            <button
              onClick={stopProp(handleAddComment)}
              className="bg-indigo-600 text-white rounded-full p-2 hover:bg-indigo-700 transition"
              disabled={!newComment.trim()}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;