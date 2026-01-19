import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import './StudyBuddyChatbot.css';

const StudyBuddyChatbot = ({ currentConcept }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: "Hi! I'm your Study Buddy 🤖 Ask me anything about finance, and I'll explain it in simple terms!"
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async (messageText = input) => {
        if (!messageText.trim() || loading) return;

        const userMessage = { role: 'user', content: messageText };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await api.post('/ai/tutor', {
                message: messageText,
                context: currentConcept ? {
                    term: currentConcept.title,
                    definition: currentConcept.article?.substring(0, 500)
                } : {}
            });

            const assistantMessage = {
                role: 'assistant',
                content: response.data.explanation
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage = {
                role: 'assistant',
                content: "Sorry, I'm having trouble connecting right now. Please try again in a moment!"
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickSummary = () => {
        if (!currentConcept) {
            alert('Please select a concept first!');
            return;
        }

        const summaryRequest = `Can you give me a quick summary of "${currentConcept.title}"?`;
        sendMessage(summaryRequest);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        sendMessage();
    };

    return (
        <div className={`study-buddy-container ${isOpen ? 'open' : ''}`}>
            {/* Floating Button */}
            {!isOpen && (
                <button className="chatbot-toggle" onClick={() => setIsOpen(true)}>
                    <span className="chatbot-icon">🤖</span>
                    <span className="chatbot-label">Study Buddy</span>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="chatbot-window">
                    {/* Header */}
                    <div className="chatbot-header">
                        <div className="header-content">
                            <span className="chatbot-avatar">🤖</span>
                            <div>
                                <h3>Study Buddy</h3>
                                <p className="status">Online</p>
                            </div>
                        </div>
                        <button className="minimize-btn" onClick={() => setIsOpen(false)}>
                            ✕
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="chatbot-messages">
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
                            >
                                <div className="message-content">
                                    {message.content}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="message assistant-message">
                                <div className="message-content typing-indicator">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Actions */}
                    {currentConcept && (
                        <div className="quick-actions">
                            <button className="quick-action-btn" onClick={handleQuickSummary}>
                                📝 Quick Summary
                            </button>
                        </div>
                    )}

                    {/* Input */}
                    <form className="chatbot-input" onSubmit={handleSubmit}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask me anything about finance..."
                            disabled={loading}
                        />
                        <button type="submit" disabled={loading || !input.trim()}>
                            <span>➤</span>
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default StudyBuddyChatbot;
