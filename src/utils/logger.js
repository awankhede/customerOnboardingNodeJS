const log = (level, message = {}) => {
    const logObject = {level, message,timestamp: new Date().toISOString()
    };
    console.log(JSON.stringify(logObject));
};

module.exports = {
    info: (message) => log('info', message),
    error: (message) => log('error', message)
};