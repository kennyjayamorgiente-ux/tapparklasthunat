const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user's favorite parking spots
router.get('/', authenticateToken, async (req, res) => {
  try {
    const favorites = await db.query(`
      SELECT 
        f.favorites_id,
        f.parking_spot_id,
        f.user_id,
        f.created_at,
        ps.spot_number,
        ps.spot_type,
        ps.status as spot_status,
        ps.parking_section_id,
        psec.section_name,
        psec.parking_area_id,
        pa.parking_area_name,
        pa.location
      FROM favorites f
      JOIN parking_spot ps ON f.parking_spot_id = ps.parking_spot_id
      JOIN parking_section psec ON ps.parking_section_id = psec.parking_section_id
      JOIN parking_area pa ON psec.parking_area_id = pa.parking_area_id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `, [req.user.user_id]);

    res.json({
      success: true,
      data: {
        favorites: favorites
      }
    });

  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch favorite parking spots'
    });
  }
});

// Add parking spot to favorites
router.post('/:parkingSpotId', authenticateToken, async (req, res) => {
  try {
    const { parkingSpotId } = req.params;

    // Check if parking spot exists
    const spot = await db.query(
      'SELECT parking_spot_id FROM parking_spot WHERE parking_spot_id = ?',
      [parkingSpotId]
    );

    if (spot.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Parking spot not found'
      });
    }

    // Check if already in favorites
    const existingFavorite = await db.query(
      'SELECT favorites_id FROM favorites WHERE user_id = ? AND parking_spot_id = ?',
      [req.user.user_id, parkingSpotId]
    );

    if (existingFavorite.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'Parking spot already in favorites',
        alreadyExists: true
      });
    }

    // Add to favorites
    await db.query(
      'INSERT INTO favorites (user_id, parking_spot_id, created_at) VALUES (?, ?, NOW())',
      [req.user.user_id, parkingSpotId]
    );

    res.status(201).json({
      success: true,
      message: 'Parking spot added to favorites'
    });

  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add parking spot to favorites'
    });
  }
});

// Remove parking spot from favorites
router.delete('/:parkingSpotId', authenticateToken, async (req, res) => {
  try {
    const { parkingSpotId } = req.params;

    // Check if favorite exists
    const favorite = await db.query(
      'SELECT favorites_id FROM favorites WHERE user_id = ? AND parking_spot_id = ?',
      [req.user.user_id, parkingSpotId]
    );

    if (favorite.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }

    // Remove from favorites
    await db.query(
      'DELETE FROM favorites WHERE user_id = ? AND parking_spot_id = ?',
      [req.user.user_id, parkingSpotId]
    );

    res.json({
      success: true,
      message: 'Parking spot removed from favorites'
    });

  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove parking spot from favorites'
    });
  }
});

// Check if parking spot is in favorites
router.get('/check/:parkingSpotId', authenticateToken, async (req, res) => {
  try {
    const { parkingSpotId } = req.params;

    const favorite = await db.query(
      'SELECT favorites_id FROM favorites WHERE user_id = ? AND parking_spot_id = ?',
      [req.user.user_id, parkingSpotId]
    );

    res.json({
      success: true,
      data: {
        isFavorite: favorite.length > 0
      }
    });

  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check favorite status'
    });
  }
});

module.exports = router;
