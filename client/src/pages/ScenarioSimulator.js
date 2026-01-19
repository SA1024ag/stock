import React, { useState } from 'react';
import api from '../services/api';
import './ScenarioSimulator.css';

const ScenarioSimulator = () => {
    const [scenario, setScenario] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const predefinedScenarios = [
        "Interest rates rise by 0.5%",
        "Oil prices surge by 20%",
        "Tech sector correction of 10%",
        "Global supply chain disruption"
    ];

    const handleSimulate = async () => {
        if (!scenario.trim()) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await api.post('/ai/simulate', { scenario });
            setResult(response.data);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to simulate scenario');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="scenario-simulator-page">
            <div className="scenario-header">
                <h1>Market Simulator</h1>
                <p>Test how your portfolio might react to hypothetical market events.</p>
            </div>

            <div className="scenario-input-section">
                <div className="predefined-chips">
                    {predefinedScenarios.map((s, index) => (
                        <button
                            key={index}
                            className="chip"
                            onClick={() => setScenario(s)}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                <div className="input-wrapper">
                    <textarea
                        value={scenario}
                        onChange={(e) => setScenario(e.target.value)}
                        placeholder="Describe a market scenario (e.g., 'Inflation drops to 2%', 'Major cyber attack on banking sector')..."
                        rows={4}
                    />
                    <button
                        className="simulate-btn"
                        onClick={handleSimulate}
                        disabled={loading || !scenario.trim()}
                    >
                        {loading ? 'Simulating...' : 'Run Simulation'}
                    </button>
                </div>
                {error && <div className="error-message">{error}</div>}
            </div>

            {result && (
                <div className="simulation-results">
                    <div className={`sentiment-badge ${result.overall_sentiment?.toLowerCase()}`}>
                        {result.overall_sentiment} Outlook
                    </div>

                    <div className="result-summary">
                        <h3>Summary</h3>
                        <p>{result.summary}</p>
                    </div>

                    <div className="key-effects">
                        <h3>Key Market Effects</h3>
                        <ul>
                            {result.key_effects?.map((effect, i) => (
                                <li key={i}>{effect}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="stocks-impact-table">
                        <h3>Projected Portfolio Impact</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Symbol</th>
                                    <th>Sector</th>
                                    <th>Est. Change</th>
                                    <th>Reasoning</th>
                                </tr>
                            </thead>
                            <tbody>
                                {result.results?.map((stock) => (
                                    <tr key={stock.symbol}>
                                        <td className="symbol-cell">{stock.symbol}</td>
                                        <td>{stock.sector}</td>
                                        <td className={stock.estimated_change_percent >= 0 ? 'positive' : 'negative'}>
                                            {stock.estimated_change_percent > 0 ? '+' : ''}
                                            {stock.estimated_change_percent}%
                                        </td>
                                        <td className="reason-cell">{stock.reason}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScenarioSimulator;
