const express = require('express');
const router = express.Router();
const BlogPost = require('../models/BlogPost');

// Use a getter to access io if passed via app.set or middleware
// Ideally, we pass it or import it. For now, let's assume `req.app.get('io')` works
// IF we set it in index.js using `app.set('io', io)`

// Get all posts
router.get('/', async (req, res) => {
    try {
        const posts = await BlogPost.find().sort({ createdAt: -1 }).limit(50);
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a post
router.post('/', async (req, res) => {
    const { content, image, author } = req.body;

    // Basic validation
    if (!content && !image) {
        return res.status(400).json({ message: 'Post must contain text or image' });
    }

    const post = new BlogPost({
        author: author || 'Anonymous', // Fallback
        content,
        image
    });

    try {
        const newPost = await post.save();

        // Emit real-time event
        const io = req.app.get('io');
        if (io) {
            io.emit('new_post', newPost);
        }

        res.status(201).json(newPost);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Like a post
router.post('/:id/like', async (req, res) => {
    const { userId } = req.body; // Expecting userId/username in body
    if (!userId) return res.status(400).json({ message: 'User ID required' });

    try {
        const post = await BlogPost.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        // Toggle like
        const index = post.likes.indexOf(userId);
        if (index === -1) {
            post.likes.push(userId); // Like
        } else {
            post.likes.splice(index, 1); // Unlike
        }

        const updatedPost = await post.save();

        // Emit update
        const io = req.app.get('io');
        if (io) {
            io.emit('update_post', updatedPost);
        }

        res.json(updatedPost);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Track post view
router.post('/:id/view', async (req, res) => {
    const { userId } = req.body; // Expecting userId/username in body
    if (!userId) return res.status(400).json({ message: 'User ID required' });

    try {
        const post = await BlogPost.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        // Add view only if user hasn't viewed before
        if (!post.views) post.views = [];
        if (!post.views.includes(userId)) {
            post.views.push(userId);
            const updatedPost = await post.save();

            // Emit update
            const io = req.app.get('io');
            if (io) {
                io.emit('update_post', updatedPost);
            }

            res.json(updatedPost);
        } else {
            res.json(post); // Already viewed
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add a comment
router.post('/:id/comment', async (req, res) => {
    const { author, content } = req.body;
    if (!content) return res.status(400).json({ message: 'Comment cannot be empty' });

    try {
        const post = await BlogPost.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const newComment = {
            author: author || 'Anonymous',
            content,
            parentId: req.body.parentId || null,
            createdAt: new Date()
        };

        post.comments.push(newComment);
        const updatedPost = await post.save();

        // Emit update
        const io = req.app.get('io');
        if (io) {
            io.emit('update_post', updatedPost);
        }

        res.json(updatedPost);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Edit a post
router.put('/:id', async (req, res) => {
    const { author, content, image } = req.body;
    if (!content) return res.status(400).json({ message: 'Content cannot be empty' });

    try {
        const post = await BlogPost.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        if (post.author !== author) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        post.content = content;
        if (image !== undefined) post.image = image;

        const updatedPost = await post.save();

        const io = req.app.get('io');
        if (io) {
            io.emit('update_post', updatedPost);
        }

        res.json(updatedPost);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete a post
router.delete('/:id', async (req, res) => {
    // Pass author in query or body to verify ownership (In real app, use auth middleware)
    const { author } = req.body;

    try {
        const post = await BlogPost.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        if (post.author !== author) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        await BlogPost.deleteOne({ _id: req.params.id });

        const io = req.app.get('io');
        if (io) {
            io.emit('delete_post', req.params.id);
        }

        res.json({ message: 'Post deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete a comment
router.delete('/:id/comment/:commentId', async (req, res) => {
    const { author } = req.body;

    try {
        const post = await BlogPost.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const comment = post.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        // Allow post author OR comment author to delete
        if (comment.author !== author && post.author !== author) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        post.comments.pull(req.params.commentId);
        const updatedPost = await post.save();

        const io = req.app.get('io');
        if (io) {
            io.emit('update_post', updatedPost);
        }

        res.json(updatedPost);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
