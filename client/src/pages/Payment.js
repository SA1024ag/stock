import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import './Payment.css';
import { useAuth } from '../context/AuthContext';

function Payment() {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleReset = async () => {
        if (!window.confirm('Are you sure you want to delete everything? This action cannot be undone.')) {
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/portfolio/reset');

            // Update local user context with new balance
            if (response.data.balance !== undefined) {
                updateUser({ ...user, virtualBalance: response.data.balance });
            }

            alert('Account reset successfully. Balance restored to ₹10,000.');
            navigate('/dashboard');
        } catch (error) {
            console.error('Reset error', error);
            alert('Failed to reset account.');
        } finally {
            setLoading(false);
        }
    };

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => {
                resolve(true);
            };
            script.onerror = () => {
                resolve(false);
            };
            document.body.appendChild(script);
        });
    };

    const handleBuyCredits = async (amount, credits) => {
        setLoading(true);
        try {
            const isLoaded = await loadRazorpay();
            if (!isLoaded) {
                alert('Razorpay SDK failed to load. Are you online?');
                setLoading(false);
                return;
            }

            // 1. Create Order
            const orderRes = await api.post('/payment/create-order', { amount });
            const { id: order_id, amount: order_amount, currency } = orderRes.data;

            // 2. Initialize Razorpay options
            const options = {
                key: process.env.REACT_APP_RAZORPAY_KEY_ID || "rzp_test_RZjgWVt2YvEEUS", // Use env var or fallback to provided key
                amount: order_amount.toString(),
                currency: currency,
                name: "Stock App Simulator",
                description: `Purchase ${credits} Credits`,
                order_id: order_id,
                handler: async function (response) {
                    try {
                        // 3. Verify Payment
                        const verifyRes = await api.post('/payment/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            creditsToAdd: credits
                        });

                        alert('Payment Successful! Credits added.');
                        updateUser({ ...user, virtualBalance: verifyRes.data.newBalance });
                    } catch (error) {
                        console.error('Verification failed', error);
                        alert('Payment verification failed.');
                    }
                },
                prefill: {
                    name: user?.username,
                    email: user?.email,
                    contact: "" // Can be added if available
                },
                theme: {
                    color: "#6366f1"
                }
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.on('payment.failed', function (response) {
                alert(response.error.description);
            });
            rzp1.open();

        } catch (error) {
            console.error('Payment initialization failed', error);
            alert('Could not initiate payment. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="payment-page-container">
            <div className="payment-header">
                <h1>Account Refinance</h1>
            </div>

            <div className="payment-content">
                {/* Flashcards Section - Now at Top */}
                <div className="flashcards-container">
                    <Card className="glass-panel pricing-card">
                        <div className="price-tag">₹3</div>
                        <h3>Starter Pack</h3>
                        <p className="credit-amount">1,000 Credits</p>
                        <p className="price-subtext">Real Money</p>
                        <Button variant="secondary" fullWidth onClick={() => handleBuyCredits(3, 1000)}>Buy Now</Button>
                    </Card>

                    <div className="pricing-card-wrapper popular">
                        <div className="popular-badge">Most Popular</div>
                        <Card className="glass-panel pricing-card">
                            <div className="price-tag">₹6</div>
                            <h3>Trader Pack</h3>
                            <p className="credit-amount">5,000 Credits</p>
                            <p className="price-subtext">Real Money</p>
                            <Button variant="primary" fullWidth onClick={() => handleBuyCredits(6, 5000)}>Buy Now</Button>
                        </Card>
                    </div>

                    <Card className="glass-panel pricing-card">
                        <div className="price-tag">₹10</div>
                        <h3>Pro Pack</h3>
                        <p className="credit-amount">10,000 Credits</p>
                        <p className="price-subtext">Real Money</p>
                        <Button variant="secondary" fullWidth onClick={() => handleBuyCredits(10, 10000)}>Buy Now</Button>
                    </Card>
                </div>

                {/* Statement Section - Now at Bottom */}
                <Card className="glass-panel payment-main-card">
                    <div className="drawdown-alert">
                        <h2>Running Low? A Drawdown is Not a Dead End.</h2>
                        <p className="drawdown-subtitle">
                            Your portfolio balance is low or has hit zero. In the real world, this is a margin call. In this learning environment, it’s a crucial lesson.
                        </p>
                    </div>

                    <div className="payment-body-text">
                        <p>
                            You have two ways to handle this. Most beginners choose to wipe the slate clean and pretend the loss never happened.
                            But real growth comes from fixing mistakes, not erasing them.
                        </p>
                        <p>
                            If you reset now, you lose your trade logs, your win/loss metrics, and the history of the decisions that brought you here.
                        </p>
                        <p className="recommendation-text">We recommend you "Refinance" instead. Why?</p>

                        <ul className="benefit-list">
                            <li><strong>Master Recovery:</strong> Learning to trade your way back from a loss is a more valuable skill than trading with a fresh, lucky start.</li>
                            <li><strong>Protect Your Data:</strong> You’ve spent weeks building this portfolio. Keep your long-term analytics intact to spot patterns in your behavior.</li>
                            <li><strong>Build Resilience:</strong> Don't get in the habit of hitting "restart" when things get tough. Stick with the market.</li>
                        </ul>
                    </div>

                    <div className="action-section">
                        <div className="reset-option">
                            <p className="reset-warning">Ready to start fresh?</p>
                            <Button
                                variant="danger"
                                onClick={handleReset}
                                disabled={loading}
                                className="btn-reset"
                            >
                                {loading ? 'Resetting...' : 'Reset Portfolio to Default (₹10,000)'}
                            </Button>
                            <p className="reset-subtext">Warning: This deletes all history and holdings.</p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

export default Payment;
