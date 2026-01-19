import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import api from '../services/api';
import StudyBuddyChatbot from '../components/StudyBuddyChatbot';
import './ModuleDetailPage.css';

const ModuleDetailPage = () => {
    const { moduleId } = useParams();
    const [moduleData, setModuleData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedConcept, setSelectedConcept] = useState(null);
    const [activeTab, setActiveTab] = useState('article'); // 'article' or 'video'
    const [completedConcepts, setCompletedConcepts] = useState(new Set());

    useEffect(() => {
        fetchModuleContent();
    }, [moduleId]);

    const fetchModuleContent = async () => {
        try {
            const response = await api.get(`/learning/module-content/${moduleId}`);
            setModuleData(response.data);

            // Select first concept by default
            if (response.data.concepts && response.data.concepts.length > 0) {
                setSelectedConcept(response.data.concepts[0]);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error fetching module content:', error);
            setLoading(false);
        }
    };

    const handleConceptSelect = (concept) => {
        setSelectedConcept(concept);
        setActiveTab('article'); // Reset to article tab
    };

    const markConceptComplete = (conceptId) => {
        setCompletedConcepts(prev => new Set([...prev, conceptId]));
    };

    const getProgress = () => {
        if (!moduleData || !moduleData.concepts) return 0;
        return Math.round((completedConcepts.size / moduleData.concepts.length) * 100);
    };

    const getYouTubeEmbedUrl = (url) => {
        if (!url) return null;
        const videoId = url.split('v=')[1]?.split('&')[0];
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    };

    if (loading) {
        return (
            <div className="module-detail-page">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading module content...</p>
                </div>
            </div>
        );
    }

    if (!moduleData) {
        return (
            <div className="module-detail-page">
                <div className="error-container">
                    <h2>Module not found</h2>
                    <Link to="/learning-hub" className="back-link">← Back to Learning Hub</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="module-detail-page">
            {/* Breadcrumb */}
            <div className="breadcrumb">
                <Link to="/">Home</Link>
                <span className="separator">›</span>
                <Link to="/learning-hub">Learning Hub</Link>
                <span className="separator">›</span>
                <span className="current">{moduleData.title}</span>
            </div>

            {/* Header with Progress */}
            <div className="module-header">
                <div className="header-content">
                    <span className="module-icon">{moduleData.icon}</span>
                    <div>
                        <h1>{moduleData.title}</h1>
                        <p>{moduleData.description}</p>
                    </div>
                </div>

                <div className="progress-section">
                    <div className="progress-label">
                        Progress: {getProgress()}%
                    </div>
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${getProgress()}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="content-container">
                {/* Vertical Tabs (Left Sidebar) */}
                <div className="vertical-tabs">
                    <h3>Concepts</h3>
                    <div className="concepts-list">
                        {moduleData.concepts.map((concept, index) => (
                            <button
                                key={concept.id}
                                className={`concept-tab ${selectedConcept?.id === concept.id ? 'active' : ''} ${completedConcepts.has(concept.id) ? 'completed' : ''}`}
                                onClick={() => handleConceptSelect(concept)}
                            >
                                <span className="concept-number">{index + 1}</span>
                                <span className="concept-title">{concept.title}</span>
                                {completedConcepts.has(concept.id) && (
                                    <span className="check-icon">✓</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area (Right Side) */}
                <div className="content-area">
                    {selectedConcept && (
                        <>
                            {/* Horizontal Tabs (Article/Video) */}
                            <div className="horizontal-tabs">
                                <button
                                    className={`tab-btn ${activeTab === 'article' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('article')}
                                >
                                    📄 Article
                                </button>
                                <button
                                    className={`tab-btn ${activeTab === 'video' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('video')}
                                >
                                    🎥 Video
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className="tab-content">
                                {activeTab === 'article' ? (
                                    <div className="article-content">
                                        <ReactMarkdown>{selectedConcept.article}</ReactMarkdown>

                                        {/* External Resources */}
                                        {selectedConcept.resources && selectedConcept.resources.length > 0 && (
                                            <div className="external-resources">
                                                <h3>📚 Additional Resources</h3>
                                                <div className="resources-grid">
                                                    {selectedConcept.resources.map((resource, index) => (
                                                        <a
                                                            key={index}
                                                            href={resource.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="resource-card"
                                                        >
                                                            <span className="resource-icon">
                                                                {resource.type === 'video' ? '🎥' : '📖'}
                                                            </span>
                                                            <span className="resource-title">{resource.title}</span>
                                                            <span className="external-icon">↗</span>
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Mark Complete Button */}
                                        {!completedConcepts.has(selectedConcept.id) && (
                                            <button
                                                className="complete-btn"
                                                onClick={() => markConceptComplete(selectedConcept.id)}
                                            >
                                                ✓ Mark as Complete
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="video-content">
                                        {getYouTubeEmbedUrl(selectedConcept.videoUrl) ? (
                                            <div className="video-wrapper">
                                                <iframe
                                                    width="100%"
                                                    height="500"
                                                    src={getYouTubeEmbedUrl(selectedConcept.videoUrl)}
                                                    title={selectedConcept.title}
                                                    frameBorder="0"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                ></iframe>
                                            </div>
                                        ) : (
                                            <div className="no-video">
                                                <p>📹 Video coming soon!</p>
                                                <p>Check out the article tab for detailed content.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Study Buddy Chatbot */}
            <StudyBuddyChatbot currentConcept={selectedConcept} />
        </div>
    );
};

export default ModuleDetailPage;
