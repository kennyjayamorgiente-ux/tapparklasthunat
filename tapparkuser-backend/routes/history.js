const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get comprehensive user history
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const offset = (page - 1) * limit;

    let history = [];

    if (!type || type === 'parking') {
      // Get parking history from reservations table
      const parkingHistory = await db.query(`
        SELECT 
          'parking' as type,
          r.reservation_id as id,
          r.time_stamp as timestamp,
          r.start_time,
          r.end_time,
          r.booking_status as status,
          v.plate_number,
          v.vehicle_type,
          v.brand,
          pa.parking_area_name as location_name,
          pa.location as location_address,
          ps.spot_number,
          ps.spot_type,
          CASE 
            WHEN r.end_time IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, r.start_time, r.end_time)
            ELSE NULL
          END as duration_minutes,
          CASE 
            WHEN r.end_time IS NOT NULL THEN CEIL(TIMESTAMPDIFF(MINUTE, r.start_time, r.end_time) / 60.0)
            ELSE NULL
          END as hours_deducted
        FROM reservations r
        JOIN vehicles v ON r.vehicle_id = v.vehicle_id
        JOIN parking_spot ps ON r.parking_spots_id = ps.parking_spot_id
        JOIN parking_section psec ON ps.parking_section_id = psec.parking_section_id
        JOIN parking_area pa ON psec.parking_area_id = pa.parking_area_id
        WHERE r.user_id = ?
        ORDER BY r.time_stamp DESC
        LIMIT ? OFFSET ?
      `, [req.user.user_id, parseInt(limit), parseInt(offset)]);

      history = history.concat(parkingHistory);
    }

    if (!type || type === 'payments') {
      // Get payment history
      const paymentHistory = await db.query(`
        SELECT 
          'payment' as type,
          p.payment_id as id,
          p.payment_date as timestamp,
          p.amount,
          'subscription' as payment_type,
          pm.method_name as payment_method,
          p.status,
          pl.plan_name as location_name,
          pl.number_of_hours,
          pl.cost
        FROM payments p
        LEFT JOIN payment_method pm ON p.payment_method_id = pm.id
        LEFT JOIN subscriptions s ON p.subscription_id = s.subscription_id
        LEFT JOIN plans pl ON s.plan_id = pl.plan_id
        WHERE s.user_id = ?
        ORDER BY p.payment_date DESC
        LIMIT ? OFFSET ?
      `, [req.user.user_id, parseInt(limit), parseInt(offset)]);

      history = history.concat(paymentHistory);
    }

    // Sort combined history by timestamp
    history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Get total counts
    const parkingCount = await db.query(
      'SELECT COUNT(*) as count FROM reservations WHERE user_id = ?',
      [req.user.user_id]
    );

    const paymentCount = await db.query(
      'SELECT COUNT(*) as count FROM payments p JOIN subscriptions s ON p.subscription_id = s.subscription_id WHERE s.user_id = ?',
      [req.user.user_id]
    );

    res.json({
      success: true,
      data: {
        history,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil((parkingCount[0].count + paymentCount[0].count) / limit),
          totalItems: parkingCount[0].count + paymentCount[0].count,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch history'
    });
  }
});

// Get parking history only
router.get('/parking', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        r.reservation_id,
        r.time_stamp,
        r.start_time,
        r.end_time,
        r.booking_status,
        v.plate_number,
        v.vehicle_type,
        v.brand,
        pa.parking_area_name as location_name,
        pa.location as location_address,
        ps.spot_number,
        ps.spot_type,
        CASE 
          WHEN r.end_time IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, r.start_time, r.end_time)
          ELSE NULL
        END as duration_minutes,
        CASE 
          WHEN r.end_time IS NOT NULL THEN CEIL(TIMESTAMPDIFF(MINUTE, r.start_time, r.end_time) / 60.0)
          ELSE NULL
        END as hours_deducted
      FROM reservations r
      JOIN vehicles v ON r.vehicle_id = v.vehicle_id
      JOIN parking_spot ps ON r.parking_spots_id = ps.parking_spot_id
      JOIN parking_section psec ON ps.parking_section_id = psec.parking_section_id
      JOIN parking_area pa ON psec.parking_area_id = pa.parking_area_id
      WHERE r.user_id = ?
    `;
    const params = [req.user.user_id];

    if (status) {
      query += ' AND r.booking_status = ?';
      params.push(status);
    }

    query += ' ORDER BY r.time_stamp DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const sessions = await db.query(query, params);

    const totalCount = await db.query(
      'SELECT COUNT(*) as count FROM reservations WHERE user_id = ?' + (status ? ' AND booking_status = ?' : ''),
      status ? [req.user.user_id, status] : [req.user.user_id]
    );

    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount[0].count / limit),
          totalItems: totalCount[0].count,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get parking history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch parking history'
    });
  }
});

// Get payment history only
router.get('/payments', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        p.payment_id,
        p.subscription_id,
        p.amount,
        'subscription' as payment_type,
        pm.method_name as payment_method,
        p.status,
        p.payment_date as created_at,
        pl.plan_name as location_name,
        pl.description as location_address,
        pl.number_of_hours,
        pl.cost
      FROM payments p
      LEFT JOIN payment_method pm ON p.payment_method_id = pm.id
      LEFT JOIN subscriptions s ON p.subscription_id = s.subscription_id
      LEFT JOIN plans pl ON s.plan_id = pl.plan_id
      WHERE s.user_id = ?
    `;
    const params = [req.user.user_id];

    if (type) {
      query += ' AND p.payment_type = ?';
      params.push(type);
    }

    query += ' ORDER BY p.payment_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const payments = await db.query(query, params);

    const totalCount = await db.query(
      'SELECT COUNT(*) as count FROM payments p JOIN subscriptions s ON p.subscription_id = s.subscription_id WHERE s.user_id = ?' + (type ? ' AND p.payment_type = ?' : ''),
      type ? [req.user.user_id, type] : [req.user.user_id]
    );

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount[0].count / limit),
          totalItems: totalCount[0].count,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history'
    });
  }
});

// Get history statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { period = '30' } = req.query; // days

    // Parking statistics
    const parkingStats = await db.query(`
      SELECT 
        COUNT(*) as total_sessions,
        SUM(CASE WHEN booking_status = 'completed' THEN 1 ELSE 0 END) as completed_sessions,
        SUM(CASE WHEN booking_status = 'active' THEN 1 ELSE 0 END) as active_sessions
      FROM reservations 
      WHERE user_id = ? AND time_stamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [req.user.user_id, parseInt(period)]);

    // Payment statistics
    const paymentStats = await db.query(`
      SELECT 
        COUNT(*) as total_payments,
        SUM(CASE WHEN payment_type = 'topup' THEN amount ELSE 0 END) as total_topup,
        SUM(CASE WHEN payment_type = 'parking_fee' THEN amount ELSE 0 END) as total_parking_fees,
        AVG(CASE WHEN payment_type = 'parking_fee' THEN amount ELSE NULL END) as avg_parking_cost
      FROM payments 
      WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [req.user.user_id, parseInt(period)]);

    // Monthly breakdown
    const monthlyBreakdown = await db.query(`
      SELECT 
        DATE_FORMAT(time_stamp, '%Y-%m') as month,
        COUNT(*) as sessions_count
      FROM reservations 
      WHERE user_id = ? AND time_stamp >= DATE_SUB(NOW(), INTERVAL 12 MONTH) AND booking_status = 'completed'
      GROUP BY DATE_FORMAT(time_stamp, '%Y-%m')
      ORDER BY month DESC
    `, [req.user.user_id]);

    // Most used locations
    const topLocations = await db.query(`
      SELECT 
        pa.parking_area_name as location_name,
        COUNT(*) as visit_count
      FROM reservations r
      JOIN parking_spot ps ON r.parking_spots_id = ps.parking_spot_id
      JOIN parking_section psec ON ps.parking_section_id = psec.parking_section_id
      JOIN parking_area pa ON psec.parking_area_id = pa.parking_area_id
      WHERE r.user_id = ? AND r.booking_status = 'completed'
      GROUP BY pa.parking_area_id, pa.parking_area_name
      ORDER BY visit_count DESC
      LIMIT 5
    `, [req.user.user_id]);

    res.json({
      success: true,
      data: {
        parking: parkingStats[0],
        payments: paymentStats[0],
        monthlyBreakdown,
        topLocations
      }
    });

  } catch (error) {
    console.error('Get history stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch history statistics'
    });
  }
});

// Get frequently used parking spots
router.get('/frequent-spots', authenticateToken, async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    // Get most frequently used parking spots based on reservation count
    const frequentSpots = await db.query(`
      SELECT 
        pa.parking_area_name as location_name,
        pa.location as location_address,
        ps.spot_number,
        ps.spot_type,
        ps.parking_spot_id,
        COUNT(r.reservation_id) as usage_count,
        MAX(r.time_stamp) as last_used,
        ps.status as spot_status,
        CASE 
          WHEN ps.status = 'available' THEN 'AVAILABLE'
          WHEN ps.status = 'occupied' THEN 'OCCUPIED'
          ELSE 'UNKNOWN'
        END as status
      FROM reservations r
      JOIN parking_spot ps ON r.parking_spots_id = ps.parking_spot_id
      JOIN parking_section psec ON ps.parking_section_id = psec.parking_section_id
      JOIN parking_area pa ON psec.parking_area_id = pa.parking_area_id
      WHERE r.user_id = ?
      GROUP BY pa.parking_area_id, ps.parking_spot_id, pa.parking_area_name, pa.location, ps.spot_number, ps.spot_type, ps.status
      ORDER BY usage_count DESC, last_used DESC
      LIMIT ?
    `, [req.user.user_id, parseInt(limit)]);

    // Get current availability for each spot
    const spotsWithAvailability = await Promise.all(
      frequentSpots.map(async (spot) => {
        // Check if spot is currently available
        const currentReservation = await db.query(`
          SELECT r.reservation_id, r.booking_status, r.start_time, r.end_time
          FROM reservations r
          WHERE r.parking_spots_id = ? 
          AND r.booking_status IN ('active', 'confirmed')
          AND r.start_time <= NOW()
          AND (r.end_time IS NULL OR r.end_time > NOW())
          ORDER BY r.start_time DESC
          LIMIT 1
        `, [spot.parking_spot_id]);

        const isCurrentlyAvailable = currentReservation.length === 0;
        
        return {
          ...spot,
          status: isCurrentlyAvailable ? 'AVAILABLE' : 'OCCUPIED',
          current_reservation: currentReservation[0] || null
        };
      })
    );

    res.json({
      success: true,
      data: {
        frequent_spots: spotsWithAvailability
      }
    });

  } catch (error) {
    console.error('Get frequent spots error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch frequent parking spots'
    });
  }
});

module.exports = router;
