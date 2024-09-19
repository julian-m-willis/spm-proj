const request = require('supertest');
const app = require('../app');

describe('Test the root path', () => {
    test('It should respond to the GET method', async () => {
        const response = await request(app).get('/');
        expect(response.statusCode).toBe(404); // Assuming there's no route defined for '/'
    });
});