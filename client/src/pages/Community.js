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
        // Connect to the same host/port as API
        // If backend is on 5000 and client on 3000, we need full URL
        // existing api.js uses REACT_APP_API_URL or localhost:5000/api
        const socketUrl = 'http://localhost:5000'; // Hardcoded for now based on context, ideally from env

        const newSocket = io(socketUrl);
        setSocket(newSocket);

        return () => newSocket.close();
    }, []);

    // Socket Event Listeners
    useEffect(() => {
        if (!socket) return;

        socket.on('connect', () => {
            console.log('Connected to Community Socket');
        });

        socket.on('new_post', (newPost) => {
            setPosts((prevPosts) => [newPost, ...prevPosts]);
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

                <CreatePost />

                <div className="posts-feed">
                    {posts.map(post => (
                        <PostCard key={post._id} post={post} />
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
