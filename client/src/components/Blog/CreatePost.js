import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

function CreatePost() {
    const { user } = useAuth();
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if ((!content && !imageUrl) || !user) return;

        setLoading(true);
        try {
            await api.post('/blog', {
                author: user.username,
                content,
                image: imageUrl
            });

            // Reset form
            setContent('');
            setImageUrl('');
        } catch (err) {
            console.error('Error creating post:', err);
            alert('Failed to create post');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-post-card glass-panel">
            <h3>Share something with the community</h3>
            <form onSubmit={handleSubmit}>
                <textarea
                    className="create-post-textarea"
                    placeholder="What's on your mind? Share your trading progress..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />

                <div className="create-post-actions">
                    <div className="image-input-container">
                        <input
                            type="text"
                            className="image-input"
                            placeholder="Image URL (optional)..."
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        className="post-btn"
                        disabled={loading || (!content && !imageUrl)}
                    >
                        {loading ? 'Posting...' : 'Post'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default CreatePost;
