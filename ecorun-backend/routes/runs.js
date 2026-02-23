const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { body, param } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');

router.post(
  '/',
  [
    body('user_id')
      .isInt({ min: 1 })
      .withMessage('user_id debe ser un número entero positivo'),

    body('run_name')
      .trim()
      .notEmpty()
      .withMessage('run_name es requerido')
      .isLength({ max: 100 })
      .withMessage('run_name no puede tener más de 100 caracteres'),

    body('description')
      .optional()
      .isString()
      .withMessage('description debe ser texto'),

    body('distance_km')
      .isFloat({ gt: 0 })
      .withMessage('distance_km debe ser mayor a 0'),

    body('duration_minutes')
      .isInt({ min: 1 })
      .withMessage('duration_minutes debe ser mayor a 0'),

    body('start_time')
      .isISO8601()
      .withMessage('start_time debe ser una fecha/hora válida'),

    body('end_time')
      .isISO8601()
      .withMessage('end_time debe ser una fecha/hora válida'),

    body('run_date')
      .isISO8601()
      .withMessage('run_date debe ser una fecha/hora válida'),

    body('points_earned')
      .optional()
      .isInt({ min: 0 })
      .withMessage('points_earned debe ser un entero >= 0')
  ],
  validateRequest,
  async (req, res) => {
    const {
      user_id,
      run_name,
      description,
      distance_km,
      duration_minutes,
      start_time,
      end_time,
      run_date,
      points_earned
    } = req.body;

    try {
      const calculatedPoints =
        typeof points_earned === 'number'
          ? points_earned
          : Math.round(Number(distance_km) * 10);

      const sql = `
        INSERT INTO runs
          (user_id, run_name, description, distance_km, duration_minutes,
          start_time, end_time, run_date, points_earned)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await pool.query(sql, [
        user_id,
        run_name,
        description || null,
        distance_km,
        duration_minutes,
        start_time,
        end_time,
        run_date,
        calculatedPoints
      ]);

      return res.status(201).json({
        id: result.insertId,
        user_id,
        run_name,
        description: description || null,
        distance_km,
        duration_minutes,
        start_time,
        end_time,
        run_date,
        points_earned: calculatedPoints,
        message: 'Run creado exitosamente'
      });
    } catch (err) {
      console.error('Error insertando run:', err);
      return res.status(500).json({ error: 'Error en la base de datos' });
    }
  }
);

router.get(
  '/user/:userId',
  [param('userId').isInt({ min: 1 }).withMessage('userId debe ser un entero positivo')],
  validateRequest,
  async (req, res) => {
    const { userId } = req.params;

    try {
      const sql = `
        SELECT id, user_id, run_name, description, distance_km, duration_minutes,
               start_time, end_time, run_date, points_earned, created_at
        FROM runs
        WHERE user_id = ?
        ORDER BY run_date DESC, id DESC
      `;

      const [rows] = await pool.query(sql, [userId]);
      return res.json(rows);
    } catch (err) {
      console.error('Error obteniendo runs:', err);
      return res.status(500).json({ error: 'Error en la base de datos' });
    }
  }
);

router.get(
  '/:id',
  [param('id').isInt({ min: 1 }).withMessage('id debe ser un entero positivo')],
  validateRequest,
  async (req, res) => {
    const { id } = req.params;

    try {
      const sql = `
        SELECT id, user_id, run_name, description, distance_km, duration_minutes,
               start_time, end_time, run_date, points_earned, created_at
        FROM runs
        WHERE id = ?
      `;

      const [rows] = await pool.query(sql, [id]);

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Run no encontrado' });
      }

      return res.json(rows[0]);
    } catch (err) {
      console.error('Error obteniendo run:', err);
      return res.status(500).json({ error: 'Error en la base de datos' });
    }
  }
);

router.put(
  '/:id',
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('id debe ser un entero positivo'),

    body('run_name')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('run_name no puede tener más de 100 caracteres'),

    body('description')
      .optional()
      .isString()
      .withMessage('description debe ser texto'),

    body('distance_km')
      .optional()
      .isFloat({ gt: 0 })
      .withMessage('distance_km debe ser mayor a 0'),

    body('duration_minutes')
      .optional()
      .isInt({ min: 1 })
      .withMessage('duration_minutes debe ser mayor a 0'),

    body('start_time')
      .optional()
      .isISO8601()
      .withMessage('start_time debe ser una fecha/hora válida'),

    body('end_time')
      .optional()
      .isISO8601()
      .withMessage('end_time debe ser una fecha/hora válida'),

    body('run_date')
      .optional()
      .isISO8601()
      .withMessage('run_date debe ser una fecha/hora válida'),

    body('points_earned')
      .optional()
      .isInt({ min: 0 })
      .withMessage('points_earned debe ser un entero >= 0')
  ],
  validateRequest,
  async (req, res) => {
    const { id } = req.params;
    const {
      run_name,
      description,
      distance_km,
      duration_minutes,
      start_time,
      end_time,
      run_date,
      points_earned
    } = req.body;

    try {
      const sql = `
        UPDATE runs
        SET
          run_name        = COALESCE(?, run_name),
          description     = COALESCE(?, description),
          distance_km     = COALESCE(?, distance_km),
          duration_minutes= COALESCE(?, duration_minutes),
          start_time      = COALESCE(?, start_time),
          end_tim e        = COALESCE(?, end_time),
          run_date        = COALESCE(?, run_date),
          points_earned   = COALESCE(?, points_earned)
        WHERE id = ?
      `;

      const [result] = await pool.query(sql, [
        run_name ?? null,
        description ?? null,
        distance_km ?? null,
        duration_minutes ?? null,
        start_time ?? null,
        end_time ?? null,
        run_date ?? null,
        points_earned ?? null,
        id
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Run no encontrado' });
      }

      return res.json({ message: 'Run actualizado exitosamente' });
    } catch (err) {
      console.error('Error actualizando run:', err);
      return res.status(500).json({ error: 'Error en la base de datos' });
    }
  }
);

router.delete(
  '/:id',
  [param('id').isInt({ min: 1 }).withMessage('id debe ser un entero positivo')],
  validateRequest,
  async (req, res) => {
    const { id } = req.params;

    try {
      const sql = 'DELETE FROM runs WHERE id = ?';
      const [result] = await pool.query(sql, [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Run no encontrado' });
      }

      return res.json({ message: 'Run eliminado exitosamente' });
    } catch (err) {
      console.error('Error eliminando run:', err);
      return res.status(500).json({ error: 'Error en la base de datos' });
    }
  }
);

module.exports = router;
