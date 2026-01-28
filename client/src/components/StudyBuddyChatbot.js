import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import './StudyBuddyChatbot.css';

const StudyBuddyChatbot = ({ currentConcept }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: "Hi! I'm Stock GPT - Your AI-powered stock market assistant. Ask me anything about investing, trading, or market analysis!"
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
                    <svg className="chatbot-logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M3 3v18h18"></path>
                        <path d="M18 17V9l-5 5-3-3-4 4"></path>
                        <circle cx="18" cy="9" r="1.5" fill="currentColor"></circle>
                    </svg>
                    <span className="chatbot-label">Stock GPT</span>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="chatbot-window">
                    {/* Header */}
                    <div className="chatbot-header">
                        <div className="header-content">
                            <div className="chatbot-logo-header">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M3 3v18h18"></path>
                                    <path d="M18 17V9l-5 5-3-3-4 4"></path>
                                    <circle cx="18" cy="9" r="1.5" fill="currentColor"></circle>
                                </svg>
                            </div>
                            <div>
                                <h3>Stock GPT</h3>
                                <p className="status">Online • Ready to help!</p>
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
