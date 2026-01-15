import React from 'react';
import './PlaceholderPages.css';

const LearningHub = () => {
    return (
        <div className="placeholder-page">
            <div className="placeholder-content">
                <div className="placeholder-icon">🎓</div>
                <h1>Learning Hub</h1>
                <p>Your comprehensive learning center for stock market education</p>
                <div className="coming-soon-badge">Coming Soon</div>
                <div className="feature-preview">
                    <h3>What's Coming:</h3>
                    <ul>
                        <li>📚 Interactive courses on stock market basics</li>
                        <li>🎥 Video tutorials and webinars</li>
                        <li>📝 Quizzes and assessments</li>
                        <li>🏆 Achievement badges and progress tracking</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default LearningHub;
