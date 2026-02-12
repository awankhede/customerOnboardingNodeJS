const axios = require('axios');
const logger = require('../utils/logger');

const DUMMY_ENDPOINT = 'https://dummy-s3-location.com/ingest';

async function sendToIngestion(data) {
    try {
        logger.info('Sending data to ingestion service');
        const response = await axios.post(DUMMY_ENDPOINT, data, {
            timeout: 5000
        });
        logger.info('Data sent to ingestion service successfully');
        return response.data;
    } catch (error) {
        logger.error('Failed to send data to ingestion service', {
            error: error.message
        });
        throw error;
    }
}

module.exports = sendToIngestion;