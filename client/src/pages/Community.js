import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import CreatePost from '../components/Blog/CreatePost';
import PostCard from '../components/Blog/PostCard';
import '../components/Blog/Blog.css';
import api from '../services/api';

function Community() {
    const [posts, setPosts] = useState([]);
    const [socket, setSocket] = useState(null);

    // Initial Fetch
    useEffect(() => {
        fetchPosts();
    }, []);

    // Socket Connection
    useEffect(() => {
        // 1. DYNAMIC URL: Uses environment variable for production, falls back to localhost
        // Removes '/api' because Socket.io connects to the root URL (e.g., https://site.com)
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
        const socketUrl = apiUrl.replace('/api', ''); 

        console.log('🔌 Community connecting to socket at:', socketUrl);
        
        const newSocket = io(socketUrl, {
            transports: ['websocket', 'polling'], // Robust connection options
            withCredentials: true
        });
        
        setSocket(newSocket);

        return () => newSocket.close();
    }, []);

    // Socket Event Listeners
    useEffect(() => {
        if (!socket) return;

        socket.on('connect', () => {
            console.log('✅ Connected to Community Socket');
        });

        socket.on('new_post', (newPost) => {
            // Deduplicate: Check if post already exists before adding
            setPosts((prevPosts) => {
                if (prevPosts.find(p => p._id === newPost._id)) return prevPosts;
                return [newPost, ...prevPosts];
            });
        });

        socket.on('update_post', (updatedPost) => {
            setPosts((prevPosts) =>
                prevPosts.map(p => p._id === updatedPost._id ? updatedPost : p)
            );
        });

        socket.on('delete_post', (deletedPostId) => {
            setPosts((prevPosts) => prevPosts.filter(p => p._id !== deletedPostId));
        });

        return () => {
            socket.off('connect');
            socket.off('new_post');
            socket.off('update_post');
            socket.off('delete_post');
        };
    }, [socket]);

    // Exposed fetch function to refresh data manually if needed
    const fetchPosts = async () => {
        try {
            const response = await api.get('/blog');
            setPosts(response.data);
        } catch (err) {
            console.error('Failed to fetch posts:', err);
        }
    };

    return (
        <div className="page-container">
            <div className="community-container">
                <h1 className="page-title">Community Feed</h1>

                {/* Pass fetchPosts as a callback so we see new posts instantly */}
                <CreatePost onPostCreated={fetchPosts} />

                <div className="posts-feed">
                    {posts.map(post => (
                        <PostCard 
                            key={post._id} 
                            post={post} 
                            onPostDeleted={fetchPosts} // Pass callback for delete
                        />
                    ))}

                    {posts.length === 0 && (
                        <div className="text-center text-muted">
                            No posts yet. Be the first to share!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Community;
