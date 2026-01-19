import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

function PostCard({ post }) {
    const { user } = useAuth();
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [loadingComment, setLoadingComment] = useState(false);

    // Edit state
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content);
    const [loadingEdit, setLoadingEdit] = useState(false);

    // Check if current user liked the post
    // The 'likes' array contains user IDs or usernames. 
    // Let's assume we store usernames for simplicity based on the model.
    // Actually the model implementation stored `userId` in routes/blog.js if available, or just pushed to array. 
    // In `routes/blog.js`: `const { userId } = req.body;`
    // We need to pass userId when liking.
    // In `Navbar.js` user object has `username`. Let's assume user._id or user.id exists.

    // Safe check if user has liked
    // In route I used `post.likes.indexOf(userId)`. 
    // So we need to send whatever identifier `likes` stores. 
    // For this implementations let's use user.username as the ID for simplicity if user.id isn't guaranteed unique/stable in this 'sim' env
    // Update: In `routes/blog.js` I expected `userId` in body.

    const isAuthor = user && user.username === post.author;

    const hasLiked = post.likes.includes(user?.username);

    const handleLike = async () => {
        if (!user) return;
        try {
            await api.post(`/blog/${post._id}/like`, { userId: user.username });
        } catch (err) {
            console.error('Error liking post:', err);
        }
    };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim() || !user) return;

        setLoadingComment(true);
        try {
            await api.post(`/blog/${post._id}/comment`, {
                author: user.username,
                content: commentText
            });
            setCommentText('');
        } catch (err) {
            console.error('Error commenting:', err);
        } finally {
            setLoadingComment(false);
        }
    };

    const handleDeletePost = async () => {
        if (!window.confirm('Are you sure you want to delete this post?')) return;
        try {
            // Need to send author in body for verification as per backend implementation
            await api.delete(`/blog/${post._id}`, { data: { author: user.username } });
        } catch (err) {
            console.error('Error deleting post:', err);
        }
    };

    const handleUpdatePost = async () => {
        if (!editContent.trim()) return;
        setLoadingEdit(true);
        try {
            await api.put(`/blog/${post._id}`, {
                author: user.username,
                content: editContent
            });
            setIsEditing(false);
        } catch (err) {
            console.error('Error updating post:', err);
        } finally {
            setLoadingEdit(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('Delete this comment?')) return;
        try {
            await api.delete(`/blog/${post._id}/comment/${commentId}`, { data: { author: user.username } });
        } catch (err) {
            console.error('Error deleting comment:', err);
        }
    };

    return (
        <div className="post-card glass-panel">
            <div className="post-header">
                <div className="post-avatar">
                    {post.author.charAt(0).toUpperCase()}
                </div>
                <div className="post-info">
                    <span className="post-author">{post.author}</span>
                    <span className="post-time">{new Date(post.createdAt).toLocaleString()}</span>
                </div>

                {isAuthor && (
                    <div className="post-manage-actions" style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="icon-btn"
                            title="Edit Post"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                        >
                            ✏️
                        </button>
                        <button
                            onClick={handleDeletePost}
                            className="icon-btn"
                            title="Delete Post"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                        >
                            🗑️
                        </button>
                    </div>
                )}
            </div>

            <div className="post-content">
                {isEditing ? (
                    <div className="edit-mode">
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="create-post-textarea"
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button onClick={() => setIsEditing(false)} className="post-btn" style={{ background: '#666' }}>Cancel</button>
                            <button onClick={handleUpdatePost} className="post-btn" disabled={loadingEdit}>Save</button>
                        </div>
                    </div>
                ) : (
                    post.content
                )}
            </div>

            {post.image && !isEditing && (
                <img src={post.image} alt="Post attachment" className="post-image" />
            )}

            <div className="post-actions">
                <button
                    className={`action-btn ${hasLiked ? 'active' : ''}`}
                    onClick={handleLike}
                >
                    <span>{hasLiked ? '❤️' : '🤍'}</span>
                    <span>{post.likes.length} Likes</span>
                </button>

                <button
                    className="action-btn"
                    onClick={() => setShowComments(!showComments)}
                >
                    <span>💬</span>
                    <span>{post.comments.length} Comments</span>
                </button>
            </div>

            {showComments && (
                <div className="comments-section">
                    <form className="comment-input-container" onSubmit={handleComment}>
                        <input
                            type="text"
                            className="comment-input"
                            placeholder="Write a comment..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                        />
                        <button type="submit" className="post-btn" disabled={loadingComment || !commentText.trim()}>
                            Send
                        </button>
                    </form>

                    <div className="comment-list">
                        {post.comments.map((comment, idx) => (
                            <div key={idx} className="comment">
                                <div className="comment-avatar">
                                    {comment.author.charAt(0).toUpperCase()}
                                </div>
                                <div className="comment-content-box" style={{ flex: 1 }}>
                                    <div className="comment-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <div className="comment-author">{comment.author}</div>
                                        {(user?.username === comment.author || isAuthor) && (
                                            <button
                                                onClick={() => handleDeleteComment(comment._id)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: 0 }}
                                                title="Delete Comment"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                    <div className="comment-text">{comment.content}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default PostCard;
