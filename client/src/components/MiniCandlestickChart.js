import React, { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries } from 'lightweight-charts';

const MiniCandlestickChart = ({ data, isPositive }) => {
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);

    useEffect(() => {
        if (!chartContainerRef.current) return;
        if (chartRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { color: 'transparent' },
                textColor: 'transparent', // Hide text
            },
            grid: {
                vertLines: { visible: false },
                horzLines: { visible: false },
            },
            width: chartContainerRef.current.clientWidth,
            height: 120, // Small fixed height
            rightPriceScale: {
                visible: false,
                borderVisible: false,
            },
            timeScale: {
                visible: false,
                borderVisible: false,
            },
            crosshair: {
                vertLine: { visible: false },
                horzLine: { visible: false },
            },
            handleScroll: false,
            handleScale: false,
        });

        const series = chart.addSeries(CandlestickSeries, {
            upColor: '#10b981',
            downColor: '#ef4444',
            borderUpColor: '#10b981',
            borderDownColor: '#ef4444',
            wickUpColor: '#10b981',
            wickDownColor: '#ef4444',
        });

        series.setData(data);
        chart.timeScale().fitContent();

        chartRef.current = chart;

        const handleResize = () => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Update data if it changes
    useEffect(() => {
        // Logic to update data if props change could go here, 
        // but for a static mini chart, initial load is usually enough.
    }, [data]);

    return (
        <div
            ref={chartContainerRef}
            style={{
                width: '100%',
                height: '120px',
                marginTop: '10px',
                pointerEvents: 'none' // Disable interaction
            }}
        />
    );
};

export default MiniCandlestickChart;
