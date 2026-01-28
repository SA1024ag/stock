import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

function PostCard({ post, onPostDeleted }) { // 1. Accept callback
    const { user } = useAuth();
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [loadingComment, setLoadingComment] = useState(false);

    // Edit state
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content);
    const [loadingEdit, setLoadingEdit] = useState(false);

    const isAuthor = user && user.username === post.author;
    const hasLiked = post.likes.includes(user?.username);

    // Track view on mount
    useEffect(() => {
        const trackView = async () => {
            if (user && user.username && post._id) {
                try {
                    await api.post(`/blog/${post._id}/view`, { userId: user.username });
                } catch (err) {
                    // Ignore view tracking errors silently
                }
            }
        };
        trackView();
    }, [post._id, user]);

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
        
        // Safety check for ID
        if (!post._id) {
            console.error("Missing Post ID");
            return;
        }

        try {
            // Ensure we are passing the data correctly for the delete request
            await api.delete(`/blog/${post._id}`, { data: { author: user.username } });
            
            // 2. Refresh the list immediately
            if (onPostDeleted) {
                onPostDeleted();
            }
        } catch (err) {
            console.error('Error deleting post:', err);
            alert('Failed to delete post. You may not be authorized.');
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

    // ... (Keep existing Helper functions: handleDeleteComment, buildCommentTree, CommentItem) ...
    // Note: Ensure CommentItem is defined here as in your original file
    // For brevity, I am reusing your exact logic for comments below
    
    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('Delete this comment?')) return;
        try {
            await api.delete(`/blog/${post._id}/comment/${commentId}`, { data: { author: user.username } });
        } catch (err) {
            console.error('Error deleting comment:', err);
        }
    };

    const buildCommentTree = (comments) => {
        const commentMap = {};
        const roots = [];
        comments.forEach(c => { commentMap[c._id] = { ...c, children: [] }; });
        comments.forEach(c => {
            if (c.parentId && commentMap[c.parentId]) {
                commentMap[c.parentId].children.push(commentMap[c._id]);
            } else {
                roots.push(commentMap[c._id]);
            }
        });
        return roots;
    };

    const CommentItem = ({ comment, depth = 0 }) => {
        const [showReplyInput, setShowReplyInput] = useState(false);
        const [replyText, setReplyText] = useState('');
        const [loadingReply, setLoadingReply] = useState(false);

        const handleReplySubmit = async (e) => {
            e.preventDefault();
            if (!replyText.trim()) return;
            setLoadingReply(true);
            try {
                await api.post(`/blog/${post._id}/comment`, {
                    author: user.username,
                    content: replyText,
                    parentId: comment._id
                });
                setReplyText('');
                setShowReplyInput(false);
            } catch (err) { console.error('Error reply:', err); } finally { setLoadingReply(false); }
        };

        return (
            <div className="comment-thread" style={{ marginLeft: depth > 0 ? '20px' : '0', marginTop: '10px' }}>
                <div className="comment">
                    <div className="comment-avatar">{comment.author.charAt(0).toUpperCase()}</div>
                    <div className="comment-content-box" style={{ flex: 1 }}>
                        <div className="comment-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div className="comment-author">{comment.author}</div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {(user?.username === comment.author || isAuthor) && (
                                    <button onClick={() => handleDeleteComment(comment._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: 0 }}>×</button>
                                )}
                            </div>
                        </div>
                        <div className="comment-text">{comment.content}</div>
                        <div className="comment-actions" style={{ marginTop: '4px' }}>
                            <button onClick={() => setShowReplyInput(!showReplyInput)} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}>Reply</button>
                        </div>
                        {showReplyInput && (
                            <form onSubmit={handleReplySubmit} style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                                <input type="text" value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder={`Reply to ${comment.author}...`} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #444', borderRadius: '4px', color: 'white', padding: '4px 8px', flex: 1 }} />
                                <button type="submit" className="post-btn" style={{ fontSize: '0.8rem', padding: '4px 12px' }} disabled={loadingReply}>Reply</button>
                            </form>
                        )}
                    </div>
                </div>
                {comment.children && comment.children.length > 0 && (
                    <div className="comment-children">
                        {comment.children.map(child => <CommentItem key={child._id} comment={child} depth={depth + 1} />)}
                    </div>
                )}
            </div>
        );
    };

    const rootComments = buildCommentTree(post.comments || []);

    return (
        <div className="post-card glass-panel">
            <div className="post-header">
                <div className="post-avatar">{post.author.charAt(0).toUpperCase()}</div>
                <div className="post-info">
                    <span className="post-author">{post.author}</span>
                    <span className="post-time">{new Date(post.createdAt).toLocaleString()}</span>
                </div>
                {isAuthor && (
                    <div className="post-manage-actions" style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                        <button onClick={() => setIsEditing(!isEditing)} className="icon-btn" title="Edit Post">✏️</button>
                        <button onClick={handleDeletePost} className="icon-btn" title="Delete Post">🗑️</button>
                    </div>
                )}
            </div>

            <div className="post-content">
                {isEditing ? (
                    <div className="edit-mode">
                        <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="create-post-textarea" />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button onClick={() => setIsEditing(false)} className="post-btn" style={{ background: '#666' }}>Cancel</button>
                            <button onClick={handleUpdatePost} className="post-btn" disabled={loadingEdit}>Save</button>
                        </div>
                    </div>
                ) : ( post.content )}
            </div>

            {post.image && !isEditing && (
                <img src={post.image} alt="Post attachment" className="post-image" />
            )}

            <div className="post-actions">
                <button className={`action-btn ${hasLiked ? 'active' : ''}`} onClick={handleLike}>
                    <span>{hasLiked ? '❤️' : '🤍'}</span><span>{post.likes ? post.likes.length : 0}</span>
                </button>
                <button className="action-btn" onClick={() => setShowComments(!showComments)}>
                    <span>💬</span><span>{post.comments ? post.comments.length : 0}</span>
                </button>
                <button className="action-btn" style={{ cursor: 'default' }}>
                    <span>👁️</span><span>{post.views ? post.views.length : 0}</span>
                </button>
            </div>

            {showComments && (
                <div className="comments-section">
                    <form className="comment-input-container" onSubmit={handleComment}>
                        <input type="text" className="comment-input" placeholder="Write a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} />
                        <button type="submit" className="post-btn" disabled={loadingComment || !commentText.trim()}>Send</button>
                    </form>
                    <div className="comment-list">
                        {rootComments.map((comment) => <CommentItem key={comment._id} comment={comment} />)}
                    </div>
                </div>
            )}
        </div>
    );
}

export default PostCard;
