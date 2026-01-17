import api from './api';

export const getNews = async () => {
    try {
        const response = await api.get('/news');
        return response.data.data;
    } catch (error) {
        console.error('News fetch error', error);
        return [];
    }
};
