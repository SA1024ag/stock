const mongoose = require('mongoose');

const BlogPostSchema = new mongoose.Schema({
    author: {
        type: String, // Storing username or user ID depending on auth implementation.
        required: true
    },
    content: {
        type: String,
        required: true
    },
    image: {
        type: String, // URL to image
        default: ''
    },
    likes: [{
        type: String // Array of user IDs/Usernames who liked
    }],
    comments: [{
        author: String,
        content: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('BlogPost', BlogPostSchema);
