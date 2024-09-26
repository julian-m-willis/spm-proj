const jwt = require('jsonwebtoken');
const authenticateToken = require('../../middleware/authenticateTokenMiddleware');

describe('authenticateToken Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            headers: {}
        };
        res = {
            sendStatus: jest.fn()
        };
        next = jest.fn();
    });

    test('should return 401 if no token is provided', () => {
        // Call the middleware with a request that has no token
        authenticateToken(req, res, next);

        // Check that `sendStatus` was called with 401
        expect(res.sendStatus).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test('should return 403 if token is invalid', () => {
        // Mock the `jwt.verify` method to simulate an invalid token
        jwt.verify = jest.fn((token, secret, callback) => {
            callback(new Error('Invalid token'), null);
        });

        // Set the authorization header
        req.headers['authorization'] = 'Bearer invalidtoken';

        // Call the middleware
        authenticateToken(req, res, next);

        // Check that `sendStatus` was called with 403
        expect(res.sendStatus).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    test('should call next if token is valid', () => {
        // Mock the `jwt.verify` method to simulate a valid token
        const user = { id: 1, name: 'John Doe' };
        jwt.verify = jest.fn((token, secret, callback) => {
            callback(null, user);
        });

        // Set the authorization header
        req.headers['authorization'] = 'Bearer validtoken';

        // Call the middleware
        authenticateToken(req, res, next);

        // Check that `req.user` is set and `next` is called
        expect(req.user).toEqual(user);
        expect(next).toHaveBeenCalled();
    });
});
