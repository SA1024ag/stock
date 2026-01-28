import io from 'socket.io-client';

// 1. Get the API URL from the environment or fallback to localhost
// 2. Remove '/api' from the end because Socket.io needs the root URL
const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace('/api', '');

console.log('🔌 Connecting Socket.io to:', API_URL);

export const socket = io(API_URL, {
    transports: ['websocket', 'polling'], // Try websocket first
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
});

export const connectSocket = () => {
    if (!socket.connected) {
        socket.connect();
    }
};

export const disconnectSocket = () => {
    if (socket.connected) {
        socket.disconnect();
    }
};
