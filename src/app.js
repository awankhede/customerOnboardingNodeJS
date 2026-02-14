const express = require('express');
const logger = require('./utils/logger');
const onboardingRoute = require('./routes/onboard');

const app = express();
const PORT = process.env.PORT || 3000

// Parse JSON bodies up to 5 mb
app.use(express.json({ limit: '5mb' }));
app.use('/api', onboardingRoute);

// Only start the server if this file is run directly
if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`Server running on port: ${PORT}`);
  });
}

module.exports = app;