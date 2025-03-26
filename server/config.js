import 'dotenv/config';

const SERVER_CONFIG = {
    PORT: process.env.PORT || 3000,
    API: {
        NYC_CRIME_DATA: 'https://data.cityofnewyork.us/resource/5uac-w243.json',
        NYC_CRIME_DATA_HEADERS: {
            'X-App-Token': process.env.NYC_OPEN_DATA_TOKEN
        },
        NEWS_API: 'https://newsdata.io/api/1/news',
        NEWS_API_PARAMS: {
            apikey: process.env.NEWS_API_KEY,
            country: 'us',
            category: 'crime',
            language: 'en'
        }
    }
};

export default SERVER_CONFIG; 