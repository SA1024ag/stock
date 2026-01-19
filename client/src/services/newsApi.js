import api from './api';

export const getNews = async (timeRange = '1d') => {
    try {
        const response = await api.get(`/news?timeRange=${timeRange}`);
        return response.data.data;
    } catch (error) {
        console.error('News fetch error', error);
        return [];
    }
};
