require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool, testConnection } = require('./db');
const authRoutes = require('./routes/auth');
const runRoutes = require('./routes/runs');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.json({
        mensaje: 'EcoRun Sevilla',
        version: '1.0.0',
        estado: 'activo',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/test-db', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT 1 + 1 as resultado');
        res.json({
            mensaje: 'Conexion DB OK',
            resultado: rows[0].resultado
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.use('/api/auth', authRoutes);
app.use('/api/runs', runRoutes);

const PORT = process.env.PORT || 8080;
testConnection().then(() => {
    app.listen(PORT, () => {
        console.log(`Servidor: http://localhost:${PORT}`);
    });
});
