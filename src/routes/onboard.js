const express = require('express');
const { z } = require('zod');
const router = express.Router();
const logger = require('../utils/logger');
const sendToIngestion = require('../services/ingestionService');
const {HttpStatusCode} = require("axios");

//health check endpoint
router.get('/healthcheck', (req, res) => {
    res.status(200).json(HttpStatusCode.Ok)
    logger.info('Health check endpoint hit successfully');
});

router.post('/onboardCustomer', async (req, res) => {
    logger.info('Received onboarding request');

    // Validate request body with Zod
    const OnboardSchema = z.object({
        firstName: z.string().min(1, 'firstName is required'),
        lastName: z.string().min(1, 'lastName is required'),
        email: z.string().email('email must be a valid email address')
    });
    const parsed = OnboardSchema.safeParse(req.body);
    if (!parsed.success) {
        logger.error('Invalid request body', parsed.error.flatten());
        return res.status(400).json({
            message: 'Invalid request body',
            issues: parsed.error.issues
        });
    }

    //If ingestion is slow, return 202 Accepted & finish ingestion in the background
    const ACCEPT_AFTER_MS = 1;
    const ingestionPromise = sendToIngestion(parsed.data);
    try {
        res = await Promise.race([
            ingestionPromise,
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('INGESTION_PENDING')), ACCEPT_AFTER_MS)
            )
        ]);
        return res.status( 200).json('Data sent to ingestion service successfully');
    } catch (error) {
        if (error && error.message === 'INGESTION_PENDING') {
            // Respond 202 and let ingestionPromise continue
            logger.info('Ingestion is taking longer than expected; returning 202 Accepted');

            ingestionPromise
                .then(() => logger.info('Background ingestion completed successfully'))
                .catch((err) =>
                    logger.error('Background ingestion failed', { error: err?.message })
                );

            return res.status(202).json({
                message: 'Request accepted and is being processed'
            });
        }

        return res.status(500).json({message: 'Failed to send data to ingestion service'});
    }
});

module.exports = router;