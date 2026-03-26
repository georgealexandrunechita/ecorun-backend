const request = require('supertest');

jest.mock('../src/config/db', () => ({
    testConnection: jest.fn(),
    pool: {
        query: jest.fn(),
        execute: jest.fn(),
    },
}));

const app = require('../server');
const db = require('../src/config/db');

describe('GET /', () => {
    it('devuelve información general de la API', async () => {
        const res = await request(app).get('/');

        expect(res.status).toBe(200);
        expect(res.body.name).toBe('EcoRun Sevilla API');
        expect(res.body.version).toBe('2.0.0');
        expect(res.body).toHaveProperty('endpoints');
        expect(res.body.endpoints).toHaveProperty('auth');
        expect(res.body.endpoints).toHaveProperty('runs');
        expect(res.body.endpoints).toHaveProperty('challenges');
    });
});

describe('GET /health', () => {
    it('devuelve status OK cuando la base de datos responde', async () => {
        db.testConnection.mockResolvedValueOnce();

        const res = await request(app).get('/health');

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('OK');
        expect(res.body).toHaveProperty('timestamp');
        expect(res.body).toHaveProperty('env');
    });

    it('devuelve 503 cuando la base de datos no responde', async () => {
        db.testConnection.mockRejectedValueOnce(new Error('ECONNREFUSED'));

        const res = await request(app).get('/health');

        expect(res.status).toBe(503);
        expect(res.body.status).toBe('DB_ERROR');
        expect(res.body).toHaveProperty('error');
    });
});

describe('Ruta no existente', () => {
    it('devuelve 404 para rutas desconocidas', async () => {
        const res = await request(app).get('/ruta-que-no-existe');

        expect(res.status).toBe(404);
    });
});
