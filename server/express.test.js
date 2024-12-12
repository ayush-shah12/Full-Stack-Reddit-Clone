const express = require('express');
const app = express();

describe('test 2', () => {
    let server;

    beforeAll((done) => {
        server = app.listen(8000, done);
    });

    afterAll((done) => {
        if (server) {
            server.close(done);
        } else {
            done();
        }
    });

    test('server is listening on port 8000', () => {
        const address = server.address();
        expect(address.port).toBe(8000);
    });
});