jest.mock('../src/services/ingestionService', () => jest.fn());
const sendToIngestion = require('../src/services/ingestionService');
const request = require('supertest');
const app = require('../src/app'); // must be AFTER jest.mock

describe('App /onboard route', () => {
    const validBody = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com'
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('returns 200 when ingestion succeeds', async () => {
        sendToIngestion.mockResolvedValue({ ok: true });

        const res = await request(app)
            .post('/api/onboardCustomer')
            .send(validBody)
            .set('Content-Type', 'application/json');

        expect(res.status).toBe(200);
    });

    test('returns 400 when required fields are missing', async () => {
        const res = await request(app)
            .post('/api/onboardCustomer')
            .send({ firstName: 'OnlyFirstName' })
            .set('Content-Type', 'application/json');

        expect(res.status).toBe(400);
    });

    test('returns 500 when ingestion fails', async () => {
        sendToIngestion.mockRejectedValueOnce(new Error('Network error'));

        const res = await request(app)
            .post('/api/onboardCustomer')
            .send(validBody)
            .set('Content-Type', 'application/json');

        expect(res.status).toBe(500);
    });
});