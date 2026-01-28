import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Sparkles, Bot, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './LearningHub.css';

const LearningHub = () => {
    const { user } = useAuth();
    const [curriculum, setCurriculum] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedModule, setSelectedModule] = useState(null);
    const [aiTutorModal, setAiTutorModal] = useState({ open: false, term: null, response: null });
    const [loadingTutor, setLoadingTutor] = useState(false);

    useEffect(() => {
        fetchCurriculum();
    }, []);

    const fetchCurriculum = async () => {
        try {
            const response = await api.get('/learning/curriculum');
            setCurriculum(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching curriculum:', error);
            setLoading(false);
        }
    };

    const askAITutor = async (termObj) => {
        setLoadingTutor(true);
        setAiTutorModal({ open: true, term: termObj, response: null });

        try {
            const response = await api.post('/learning/ask-tutor', {
                term: termObj.term,
                definition: termObj.simpleDefinition,
                analogy: termObj.realWorldAnalogy
            });

            setAiTutorModal({ open: true, term: termObj, response: response.data });
        } catch (error) {
            console.error('Error asking AI tutor:', error);
            setAiTutorModal({
                open: true,
                term: termObj,
                response: {
                    explanation: "Sorry, I'm having trouble connecting right now. Please try again in a moment!",
                    error: true
                }
            });
        } finally {
            setLoadingTutor(false);
        }
    };

    const closeModal = () => {
        setAiTutorModal({ open: false, term: null, response: null });
    };

    if (loading) {
        return (
            <div className="learning-hub">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading curriculum...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="learning-hub">
            <header className="learning-header">
                <h1><BookOpen size={32} className="header-icon" /> Learning Hub</h1>
                <p>Master the fundamentals of stock market investing with our structured curriculum</p>
            </header>

            <div className="modules-grid">
                {curriculum?.modules.map((module) => (
                    <Link to={`/module/${module.id}`} key={module.id} className="module-card-link">
                        <div className="module-card">
                            <div className="module-header">
                                <span className="module-icon">{module.icon}</span>
                                <h2>{module.title}</h2>
                            </div>
                            <p className="module-description">{module.description}</p>

                            <div className="module-footer">
                                <span className="concept-count">
                                    {module.keyTerms?.length || 0} Key Concepts
                                </span>
                                <span className="explore-btn">
                                    Start Learning →
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* AI Tutor Modal */}
            {aiTutorModal.open && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2><Bot size={24} /> AI Financial Mentor</h2>
                            <button className="close-btn" onClick={closeModal}><X size={20} /></button>
                        </div>

                        <div className="modal-body">
                            <h3>{aiTutorModal.term?.term}</h3>

                            {loadingTutor ? (
                                <div className="tutor-loading">
                                    <div className="spinner"></div>
                                    <p>Your AI mentor is thinking...</p>
                                </div>
                            ) : (
                                <div className="tutor-response">
                                    <p>{aiTutorModal.response?.explanation}</p>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button className="close-modal-btn" onClick={closeModal}>
                                Got it, thanks!
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LearningHub;
