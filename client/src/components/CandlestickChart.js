import React, { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';
import './CandlestickChart.css';

function CandlestickChart({ symbol, data, currentPrice, onTimeframeChange, selectedTimeframe }) {
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const candlestickSeriesRef = useRef(null);

    // Handle timeframe change
    const handleTimeframeChange = (newTimeframe) => {
        if (onTimeframeChange) {
            onTimeframeChange(newTimeframe);
        }
    };

    useEffect(() => {
        if (!chartContainerRef.current) return;

        // Prevent creating chart twice (React 18 Strict Mode)
        if (chartRef.current) return;

        // Create chart
        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { color: 'transparent' },
                textColor: '#9ca3af',
            },
            grid: {
                vertLines: { color: 'rgba(42, 46, 57, 0.3)' },
                horzLines: { color: 'rgba(42, 46, 57, 0.3)' },
            },
            crosshair: {
                mode: 1,
            },
            rightPriceScale: {
                borderColor: 'rgba(197, 203, 206, 0.4)',
                autoScale: true,
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.1,
                },
            },
            timeScale: {
                borderColor: 'rgba(197, 203, 206, 0.4)',
                timeVisible: true,
                secondsVisible: false,
                rightOffset: 5,
                barSpacing: 10,
                fixLeftEdge: false,
                fixRightEdge: false,
            },
            width: chartContainerRef.current.clientWidth,
            height: 400,
        });

        chartRef.current = chart;

        // Add candlestick series
        const candlestickSeries = chart.addCandlestickSeries({
            upColor: '#10b981',
            downColor: '#ef4444',
            borderUpColor: '#10b981',
            borderDownColor: '#ef4444',
            wickUpColor: '#10b981',
            wickDownColor: '#ef4444',
        });

        candlestickSeriesRef.current = candlestickSeries;

        // Handle resize
        const handleResize = () => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                });
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
                candlestickSeriesRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!candlestickSeriesRef.current || !data || data.length === 0) return;

        try {
            // Format data for the chart
            const formattedData = data.map(item => {
                // Add IST offset (5 hours 30 minutes = 19800 seconds)
                const timestamp = (new Date(item.date).getTime() / 1000) + 19800;
                return {
                    time: timestamp,
                    open: parseFloat(item.open),
                    high: parseFloat(item.high),
                    low: parseFloat(item.low),
                    close: parseFloat(item.close),
                };
            }).filter(item =>
                !isNaN(item.time) &&
                !isNaN(item.open) &&
                !isNaN(item.high) &&
                !isNaN(item.low) &&
                !isNaN(item.close)
            );

            if (formattedData.length > 0) {
                candlestickSeriesRef.current.setData(formattedData);

                // Fit content and ensure proper scaling
                if (chartRef.current) {
                    chartRef.current.timeScale().fitContent();
                    // Small delay to ensure chart renders properly
                    setTimeout(() => {
                        if (chartRef.current) {
                            chartRef.current.timeScale().scrollToRealTime();
                        }
                    }, 100);
                }
            }
        } catch (error) {
            console.error('Error setting chart data:', error);
        }
    }, [data]);

    // Update the last candle with current price in real-time
    useEffect(() => {
        if (!candlestickSeriesRef.current || !currentPrice || !data || data.length === 0) return;

        try {
            const lastCandle = data[data.length - 1];

            // Validate that current price is reasonable (within 20% of last close)
            const priceChangePercent = Math.abs((currentPrice - lastCandle.close) / lastCandle.close);
            if (priceChangePercent > 0.2) {
                // console.warn('Current price change too large, skipping update:', priceChangePercent);
                // return;
            }

            const updatedCandle = {
                time: (new Date(lastCandle.date).getTime() / 1000) + 19800,
                open: lastCandle.open,
                high: Math.max(lastCandle.high, currentPrice),
                low: Math.min(lastCandle.low, currentPrice),
                close: currentPrice,
            };

            candlestickSeriesRef.current.update(updatedCandle);
        } catch (error) {
            console.error('Error updating candle:', error);
        }
    }, [currentPrice, data]);

    return (
        <div className="candlestick-chart-container">
            <div className="chart-header">
                <h3 className="chart-title">Price Chart</h3>
                <div className="timeframe-selector">
                    {['1D', '1W', '1M', '1Y'].map((tf) => (
                        <button
                            key={tf}
                            className={`timeframe-btn ${selectedTimeframe === tf ? 'active' : ''}`}
                            onClick={() => handleTimeframeChange(tf)}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
            </div>
            <div style={{ position: 'relative' }}>
                <div ref={chartContainerRef} className="chart-wrapper" style={{ minHeight: '400px' }} />
                {(!data || data.length === 0) && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#9ca3af',
                        pointerEvents: 'none'
                    }}>
                        <p>Loading chart data...</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CandlestickChart;
