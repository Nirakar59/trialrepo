import { BadgeCheck, Heart, MessageCircle, Share2, Send, Reply, Trash2Icon, ArrowLeft } from 'lucide-react'
import { useState, useEffect } from 'react'
import moment from 'moment'
import API from '../api/api'
import { useNavigate, useParams } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

const PostDetail = () => {
    const { postId } = useParams()
    const [post, setPost] = useState(null)
    const [loading, setLoading] = useState(true)
    const [likes, setLikes] = useState([])
    const [shares, setShares] = useState([])
    const [comments, setComments] = useState([])
    const [commentCount, setCommentCount] = useState(0)
    const [newComment, setNewComment] = useState('')
    const [newReply, setNewReply] = useState('')
    const [replyingToCommentId, setReplyingToCommentId] = useState(null)
    const currentUser = useAuth().user
    const navigate = useNavigate()

    // Fetch post details
    useEffect(() => {
        const fetchPost = async () => {
            try {
                const res = await API.get(`/post/getpostbyid/${postId}`, { withCredentials: true })
                const fetchedPost = res.data.post;
                setPost(fetchedPost)
                setLikes(fetchedPost.likes || [])
                setShares(fetchedPost.shares || [])
                setComments(fetchedPost.comments || [])
                setCommentCount(fetchedPost.comments ? fetchedPost.comments.length : 0)
                setLoading(false)
            } catch (err) {
                console.error('Error fetching post:', err)
                setLoading(false)
            }
        }
        fetchPost()
    }, [postId])

    // Highlight hashtags
    const postWithHashtags = post?.text?.replace(/(#\w+)/g, '<span class="text-indigo-600 font-medium">$1</span>') || ''

    const handleLike = async () => {
        if (!post) return
        try {
            const res = await API.put(`/post/likepost/${post._id}`, {}, { withCredentials: true })
            setLikes(res.data.post.likes)
        } catch (err) {
            console.error('Error liking post:', err)
        }
    }

    const handleAddComment = async () => {
        if (!newComment.trim() || !post) return
        try {
            const res = await API.post(`/post/${post._id}/comments`, { text: newComment }, { withCredentials: true })
            const newComm = res.data.comment
            setComments([...comments, newComm])
            setCommentCount(prev => prev + 1)
            setNewComment('')
        } catch (err) {
            console.error('Error adding comment:', err)
        }
    }

    const handleAddReply = async (commentId) => {
        if (!newReply.trim() || !post) return
        try {
            const res = await API.post(`/post/${post._id}/comments/${commentId}/replies`, { text: newReply }, { withCredentials: true })
            const newRep = res.data.reply
            setComments(comments.map(c =>
                c._id === commentId ? { ...c, replies: [...(c.replies || []), newRep] } : c
            ))
            setNewReply('')
            setReplyingToCommentId(null)
        } catch (err) {
            console.error('Error adding reply:', err)
        }
    }

    const handleRepost = async () => {
        if (!post) return
        try {
            const res = await API.post(`/post/${post._id}/share`, {}, { withCredentials: true })
            setShares(res.data.post.shares)
        } catch (err) {
            console.error('Error reposting:', err)
        }
    }

    const handlePostDelete = async () => {
        if (!post || !window.confirm('Delete this post?')) return
        try {
            await API.delete(`/post/deletepost/${post._id}`, { withCredentials: true })
            navigate(-1) // Go back
        } catch (err) {
            console.error('Error deleting post:', err)
        }
    }

    const handleExternalShare = async () => {
        if (!post) return
        const shareData = {
            title: 'Check out this post!',
            text: post.text || `Post by ${post.userId.fullname}`,
            url: window.location.href
        }
        try {
            if (navigator.share) {
                await navigator.share(shareData)
            } else {
                await navigator.clipboard.writeText(shareData.url)
                alert('Link copied to clipboard!')
            }
        } catch (err) {
            console.error('Error sharing:', err)
            alert('Link: ' + shareData.url)
        }
    }

    const isOwnPost = currentUser && post?.userId && (currentUser._id === post.userId._id || currentUser._id === post.userId)

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    if (!post) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-gray-500">
                <p>Post not found.</p>
                <button onClick={() => navigate(-1)} className="mt-4 text-indigo-600 hover:underline">
                    Go Back
                </button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back</span>
                </button>

                {/* Post Card */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    {/* User Info */}
                    <div
                        onClick={() => navigate(`/profile/${post.userId._id}`)}
                        className="inline-flex items-center gap-3 cursor-pointer mb-4"
                    >
                        <img
                            src={post.userId?.profilePics || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200"}
                            alt=""
                            className="w-12 h-12 rounded-full shadow"
                        />
                        <div>
                            <div className="flex items-center space-x-1">
                                <span className="font-semibold text-gray-900">{post.userId?.fullname || "Mr.Nepal"}</span>
                                {post.userId?.verified && <BadgeCheck className="w-5 h-5 text-blue-500" />}
                            </div>
                            <div className="text-gray-500 text-sm">
                                @{post.userId?.username || "Mr.Nepal"} • {moment(post.createdAt).fromNow()}
                            </div>
                        </div>
                    </div>

                    {/* Post Text */}
                    {post.text && (
                        <div
                            className="text-gray-800 text-base whitespace-pre-line mb-4 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: postWithHashtags }}
                        />
                    )}

                    {/* Images Grid */}
                    {post.image && post.image.length > 0 && (
                        <div className={`grid ${post.image.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-3 mb-4`}>
                            {post.image.map((img, index) => (
                                <img
                                    key={index}
                                    src={img}
                                    className={`rounded-lg object-cover w-full ${post.image.length === 1 ? 'h-96' : 'h-64'}`}
                                    alt={`Post image ${index + 1}`}
                                />
                            ))}
                        </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex items-center justify-between text-gray-600 text-sm pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-6">
                            <button
                                className={`flex items-center gap-1 transition ${likes.includes(currentUser?._id) ? 'text-red-500' : 'hover:text-red-500'}`}
                                onClick={handleLike}
                            >
                                <Heart className={`w-5 h-5 ${likes.includes(currentUser?._id) ? 'fill-red-500' : ''}`} />
                                <span>{likes.length}</span>
                            </button>

                            <button
                                className="flex items-center gap-1 hover:text-indigo-600 transition"
                                onClick={() => document.getElementById('comments-section').scrollIntoView({ behavior: 'smooth' })}
                            >
                                <MessageCircle className="w-5 h-5" />
                                <span>{commentCount}</span>
                            </button>

                            {/* <button
                                className={`flex items-center gap-1 transition ${shares.includes(currentUser?._id) ? 'text-green-500' : 'hover:text-green-500'}`}
                                onClick={handleRepost}
                            >
                                <Reply className={`w-5 h-5 ${shares.includes(currentUser?._id) ? 'fill-green-500' : ''}`} />
                                <span>{shares.length}</span>
                            </button> */}

                            <button
                                className="flex items-center gap-1 hover:text-gray-800 transition"
                                onClick={handleExternalShare}
                            >
                                <Share2 className="w-5 h-5" />
                            </button>
                        </div>

                        {isOwnPost && (
                            <button
                                onClick={handlePostDelete}
                                className="text-red-600 hover:text-red-700 transition"
                            >
                                <Trash2Icon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Comments Section */}
                <div id="comments-section" className="mt-8 bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Comments ({commentCount})</h3>

                    {/* Add Comment */}
                    <div className="flex gap-3 mb-6">
                        <img
                            src={currentUser?.profilePics || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200"}
                            alt=""
                            className="w-10 h-10 rounded-full shadow"
                        />
                        <div className="flex-1 flex gap-2">
                            <input
                                type="text"
                                placeholder="Write a comment..."
                                className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
                            />
                            <button
                                onClick={handleAddComment}
                                disabled={!newComment.trim()}
                                className="bg-indigo-600 text-white rounded-full p-2 hover:bg-indigo-700 transition disabled:opacity-50"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Comments List */}
                    <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
                        {comments.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">No comments yet. Be the first!</p>
                        ) : (
                            comments.map((comment) => (
                                <div key={comment._id} className="flex gap-3">
                                    <img
                                        src={comment.userId?.profilePics || comment.userId?.profile_picture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200"}
                                        alt=""
                                        className="w-9 h-9 rounded-full shadow"
                                    />
                                    <div className="flex-1">
                                        <div className="bg-gray-100 rounded-2xl px-4 py-3">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium text-gray-900">
                                                    {comment.userId?.fullname || 'Anonymous'}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {moment(comment.createdAt).fromNow()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-700">{comment.text}</p>
                                        </div>

                                        <button
                                            onClick={() => setReplyingToCommentId(replyingToCommentId === comment._id ? null : comment._id)}
                                            className="text-xs text-indigo-600 hover:underline mt-2"
                                        >
                                            Reply
                                        </button>

                                        {/* Replies */}
                                        {comment.replies && comment.replies.length > 0 && (
                                            <div className="ml-12 mt-3 space-y-3">
                                                {comment.replies.map((reply) => (
                                                    <div key={reply._id} className="flex gap-2">
                                                        <img
                                                            src={reply.userId?.profilePics || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200"}
                                                            alt=""
                                                            className="w-7 h-7 rounded-full shadow"
                                                        />
                                                        <div className="bg-gray-50 rounded-2xl px-3 py-2 flex-1">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-xs font-medium text-gray-900">
                                                                    {reply.userId?.fullname || 'Anonymous'}
                                                                </span>
                                                                <span className="text-xs text-gray-500">
                                                                    {moment(reply.createdAt).fromNow()}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-700">{reply.text}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Reply Input */}
                                        {replyingToCommentId === comment._id && (
                                            <div className="mt-3 flex gap-2 items-center">
                                                <input
                                                    type="text"
                                                    placeholder="Write a reply..."
                                                    className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
                                                    value={newReply}
                                                    onChange={(e) => setNewReply(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddReply(comment._id)}
                                                />
                                                <button
                                                    onClick={() => handleAddReply(comment._id)}
                                                    disabled={!newReply.trim()}
                                                    className="bg-indigo-600 text-white rounded-full p-2 hover:bg-indigo-700 transition disabled:opacity-50"
                                                >
                                                    <Send className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PostDetail