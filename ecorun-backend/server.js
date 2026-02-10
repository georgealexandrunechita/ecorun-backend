require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

const authRoutes = require('./routes/auth');
const runsRoutes = require('./routes/runs');
const challengesRoutes = require('./routes/challenges');
const errorHandler = require('./middleware/errorHandler');

const PORT = process.env.PORT || 8080;


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.json({
        message: 'EcoRun API funcionando',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            runs: '/api/runs',
            challenges: '/api/challenges'
        }
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/runs', runsRoutes);
app.use('/api/challenges', challengesRoutes);

app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Servidor: http://localhost:${PORT}`);
});
