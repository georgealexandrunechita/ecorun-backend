require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const { testConnection } = require('./src/config/db');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');
const authRoutes = require('./src/routes/auth');
const runsRoutes = require('./src/routes/runs');
const challengesRoutes = require('./src/routes/challenges');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', async (req, res) => {
    try {
        await testConnection();
        res.status(200).json({ 
            status: 'OK', 
            timestamp: new Date().toISOString(),
            env: process.env.NODE_ENV || 'development'
        });
    } catch (error) {
        res.status(503).json({ status: 'DB_ERROR', error: error.message });
    }
});

app.get('/', (req, res) => {
    res.json({
        name: 'EcoRun Sevilla API',
        version: '2.0.0',
        status: 'production-ready',
        endpoints: {
            health: '/health',
            auth: '/api/auth',
            runs: '/api/runs',
            challenges: '/api/challenges'
        }
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/runs', runsRoutes);
app.use('/api/challenges', challengesRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, async () => {
    console.log(`🚀 EcoRun API v2.0 - http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    await testConnection();
});
