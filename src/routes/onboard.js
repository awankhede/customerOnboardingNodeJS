const express = require('express');
const { z } = require('zod');
const{HttpStatusCode} = require('axios');
const logger = require('../utils/logger');
const sendToIngestion = require('../services/ingestionService');

const router = express.Router();

//health check endpoint
router.get('/healthcheck', (req, res) => {
    res.status(200).json(HttpStatusCode.Ok)
    logger.info('Health check endpoint hit successfully');
});

router.post('/onboardCustomer', async (req, res) => {
    logger.info('Received onboarding request');

    const parsedObject = parseObject(req)

    if (!parsedObject.success) {
        logger.error('Invalid request body', parsedObject.error.flatten());
        return res.status(400).json({
            message: 'Invalid request body',
            issues: parsedObject.error.issues
        });
    }

    //If ingestion is slow, return 202 Accepted & finish ingestion in the background
    const ACCEPT_AFTER_MS = 1;
    const ingestionCall = sendToIngestion(parsedObject.data);

    try {
        await Promise.race([
            ingestionCall,
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('INGESTION_PENDING')), ACCEPT_AFTER_MS)
            )
        ]);
        return res.status(200).json('Data sent to ingestion service successfully');
    } catch (error) {
        if (error && error.message === 'INGESTION_PENDING') {
            // Respond 202 and let ingestionCall continue
            logger.info('Ingestion is taking longer than expected; returning 202 Accepted');

            ingestionCall
                .then(() => logger.info('Background ingestion completed successfully'))
                .catch((err) =>
                    logger.error('Background ingestion failed', {error: err?.message})
                );

            return res.status(202).json({
                message: 'Request accepted and is being processed'
            });
        }

        return res.status(500).json({message: 'Failed to send data to ingestion service'});
    }
});


const parseObject = (req) => {
    // Validate request body with Zod
    const onboardSchema = z.object({
        firstName: z.string().min(1, 'firstName is required'),
        lastName: z.string().min(1, 'lastName is required'),
        email: z.string().email('email must be a valid email address')
    });
    return onboardSchema.safeParse(req.body);
}

module.exports = router;