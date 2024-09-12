const axios = require('axios');

const request = async (
    url,
    method,
    data,
    headers
) => {
    try {
        if (method === 'get') {
            const response = await axios.get(url, { headers });
            return response.data;
        } else if (method === 'post') {
            const response = await axios.post(url, data, { headers });
            return response.data;
        }

        return null;
    } catch (error) {
        console.error("Erreur pendant le scraping", error);
        return null;
    }
};

module.exports = request;