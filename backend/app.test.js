const request = require('supertest');
const app = require('./app');

describe('Test the root path', () => {
    test('It should respond to the GET method', async () => {
        const response = await request(app).get('/');
        expect(response.statusCode).toBe(404); // Assuming there's no route defined for '/'
    });
});

describe('Test the /auth path', () => {
    test('It should respond to the GET method', async () => {
        const response = await request(app).get('/auth');
        expect(response.statusCode).toBe(200); // Assuming there's a GET route defined for '/auth'
    });

    test('It should respond to the POST method', async () => {
        const response = await request(app)
            .post('/auth')
            .send({ username: 'testuser', password: 'testpassword' });
        expect(response.statusCode).toBe(200); // Assuming successful authentication
    });
});

describe('Test the /arrangements path', () => {
    test('It should respond to the GET method', async () => {
        const response = await request(app).get('/arrangements');
        expect(response.statusCode).toBe(200); // Assuming there's a GET route defined for '/arrangements'
    });

    test('It should respond to the POST method', async () => {
        const response = await request(app)
            .post('/arrangements')
            .send({ name: 'Test Arrangement' });
        expect(response.statusCode).toBe(201); // Assuming successful creation
    });
});

describe('Test the /schedules path', () => {
    test('It should respond to the GET method', async () => {
        const response = await request(app).get('/schedules');
        expect(response.statusCode).toBe(200); // Assuming there's a GET route defined for '/schedules'
    });

    test('It should respond to the POST method', async () => {
        const response = await request(app)
            .post('/schedules')
            .send({ date: '2023-10-10', event: 'Test Event' });
        expect(response.statusCode).toBe(201); // Assuming successful creation
    });
});