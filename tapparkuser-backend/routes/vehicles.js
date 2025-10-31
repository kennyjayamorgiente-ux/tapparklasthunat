const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const vehicleValidation = [
  body('plateNumber').trim().isLength({ min: 1 }).withMessage('Plate number is required'),
  body('vehicleType').isIn(['car', 'motorcycle', 'bicycle', 'ebike']).withMessage('Valid vehicle type is required'),
  body('brand').optional().trim().isLength({ min: 1 }).withMessage('Brand cannot be empty'),
  body('color').optional().trim().isLength({ min: 1 }).withMessage('Color cannot be empty')
];

// Get all vehicles for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const vehicles = await db.query(`
      SELECT vehicle_id as id, plate_number, vehicle_type, brand, color
      FROM vehicles 
      WHERE user_id = ? 
      ORDER BY vehicle_id ASC
    `, [req.user.user_id]);

    res.json({
      success: true,
      data: {
        vehicles
      }
    });

  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicles'
    });
  }
});

// Get specific vehicle
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const vehicles = await db.query(`
      SELECT vehicle_id as id, plate_number, vehicle_type, brand, color
      FROM vehicles 
      WHERE vehicle_id = ? AND user_id = ?
    `, [id, req.user.user_id]);

    if (vehicles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.json({
      success: true,
      data: {
        vehicle: vehicles[0]
      }
    });

  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicle'
    });
  }
});

// Add new vehicle
router.post('/', authenticateToken, vehicleValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { plateNumber, vehicleType, brand, color } = req.body;

    // Check if plate number already exists for this user
    const existingVehicle = await db.query(
      'SELECT vehicle_id FROM vehicles WHERE user_id = ? AND plate_number = ?',
      [req.user.user_id, plateNumber]
    );

    if (existingVehicle.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle with this plate number already exists'
      });
    }

    // Insert new vehicle
    const result = await db.query(`
      INSERT INTO vehicles (user_id, plate_number, vehicle_type, brand, color)
      VALUES (?, ?, ?, ?, ?)
    `, [req.user.user_id, plateNumber, vehicleType, brand, color]);

    // Get the created vehicle
    const newVehicle = await db.query(
      'SELECT vehicle_id as id, plate_number, vehicle_type, brand, color FROM vehicles WHERE vehicle_id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Vehicle added successfully',
      data: {
        vehicle: newVehicle[0]
      }
    });

  } catch (error) {
    console.error('Add vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add vehicle'
    });
  }
});

// Update vehicle
router.put('/:id', authenticateToken, vehicleValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { plateNumber, vehicleType, brand, color } = req.body;

    // Check if vehicle exists and belongs to user
    const existingVehicle = await db.query(
      'SELECT vehicle_id FROM vehicles WHERE vehicle_id = ? AND user_id = ?',
      [id, req.user.user_id]
    );

    if (existingVehicle.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Check if plate number already exists for another vehicle of this user
    const duplicateVehicle = await db.query(
      'SELECT vehicle_id FROM vehicles WHERE user_id = ? AND plate_number = ? AND vehicle_id != ?',
      [req.user.user_id, plateNumber, id]
    );

    if (duplicateVehicle.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle with this plate number already exists'
      });
    }

    // Update vehicle
    await db.query(`
      UPDATE vehicles 
      SET plate_number = ?, vehicle_type = ?, brand = ?, color = ?
      WHERE vehicle_id = ? AND user_id = ?
    `, [plateNumber, vehicleType, brand, color, id, req.user.user_id]);

    // Get updated vehicle
    const updatedVehicle = await db.query(
      'SELECT vehicle_id as id, plate_number, vehicle_type, brand, color FROM vehicles WHERE vehicle_id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Vehicle updated successfully',
      data: {
        vehicle: updatedVehicle[0]
      }
    });

  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update vehicle'
    });
  }
});

// Delete vehicle
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if vehicle exists and belongs to user
    const existingVehicle = await db.query(
      'SELECT vehicle_id FROM vehicles WHERE vehicle_id = ? AND user_id = ?',
      [id, req.user.user_id]
    );

    if (existingVehicle.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Check if vehicle is currently in an active parking session
    const activeSession = await db.query(
      'SELECT id FROM parking_sessions WHERE vehicle_id = ? AND status = "active"',
      [id]
    );

    if (activeSession.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete vehicle with active parking session'
      });
    }

    // Delete vehicle
    await db.query(
      'DELETE FROM vehicles WHERE vehicle_id = ? AND user_id = ?',
      [id, req.user.user_id]
    );

    // Vehicle deleted successfully

    res.json({
      success: true,
      message: 'Vehicle deleted successfully'
    });

  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete vehicle'
    });
  }
});

// Note: Set default vehicle functionality removed since is_default column doesn't exist in database

module.exports = router;
