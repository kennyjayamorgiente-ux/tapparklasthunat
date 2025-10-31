const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get vehicle types with occupied, vacant, and total capacity
router.get('/vehicle-types', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Fetching vehicle types data...');

    // Query to get vehicle type statistics
    const query = `
      SELECT 
        ps.spot_type as vehicle_type,
        COUNT(*) as total_capacity,
        SUM(CASE WHEN ps.status = 'occupied' THEN 1 ELSE 0 END) as occupied,
        SUM(CASE WHEN ps.status = 'free' THEN 1 ELSE 0 END) as vacant,
        SUM(CASE WHEN ps.status = 'reserved' THEN 1 ELSE 0 END) as reserved
      FROM parking_spot ps
      INNER JOIN parking_section psec ON ps.parking_section_id = psec.parking_section_id
      INNER JOIN parking_area pa ON psec.parking_area_id = pa.parking_area_id
      WHERE pa.status = 'active'
      GROUP BY ps.spot_type
      ORDER BY 
        CASE ps.spot_type 
          WHEN 'car' THEN 1
          WHEN 'motorcycle' THEN 2
          WHEN 'bike' THEN 3
          ELSE 4
        END
    `;

    const results = await db.query(query);
    
    console.log(`Found ${results.length} vehicle types:`);
    results.forEach(type => {
      console.log(`  - ${type.vehicle_type}: Total: ${type.total_capacity}, Occupied: ${type.occupied}, Vacant: ${type.vacant}, Reserved: ${type.reserved}`);
    });

    // Format the response to match the frontend expectations
    const vehicleTypes = results.map(type => ({
      id: type.vehicle_type,
      name: type.vehicle_type.charAt(0).toUpperCase() + type.vehicle_type.slice(1),
      totalCapacity: parseInt(type.total_capacity),
      occupied: parseInt(type.occupied),
      available: parseInt(type.vacant),
      reserved: parseInt(type.reserved)
    }));

    res.json({
      success: true,
      data: {
        vehicleTypes
      }
    });

  } catch (error) {
    console.error('Error fetching vehicle types:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicle types data',
      error: error.message
    });
  }
});

// Get parking slots with detailed information
router.get('/parking-slots', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Fetching parking slots data...');

    const query = `
      SELECT 
        ps.parking_spot_id as id,
        ps.spot_number as slotId,
        ps.spot_type as vehicleType,
        ps.status,
        psec.section_name as section,
        pa.parking_area_name as areaName,
        pa.location
      FROM parking_spot ps
      INNER JOIN parking_section psec ON ps.parking_section_id = psec.parking_section_id
      INNER JOIN parking_area pa ON psec.parking_area_id = pa.parking_area_id
      WHERE pa.status = 'active'
      ORDER BY 
        CASE ps.spot_type 
          WHEN 'car' THEN 1
          WHEN 'motorcycle' THEN 2
          WHEN 'bike' THEN 3
          ELSE 4
        END,
        psec.section_name, 
        ps.spot_number
    `;

    const results = await db.query(query);
    
    console.log(`Found ${results.length} parking slots`);

    // Format the response
    const parkingSlots = results.map(slot => ({
      id: slot.id,
      slotId: slot.slotId,
      vehicleType: slot.vehicleType,
      status: slot.status,
      section: slot.section,
      areaName: slot.areaName,
      location: slot.location
    }));

    res.json({
      success: true,
      data: {
        parkingSlots
      }
    });

  } catch (error) {
    console.error('Error fetching parking slots:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch parking slots data',
      error: error.message
    });
  }
});

// Get dashboard statistics
router.get('/dashboard-stats', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Fetching dashboard statistics...');

    // Get total statistics
    const totalQuery = `
      SELECT 
        COUNT(*) as total_spots,
        SUM(CASE WHEN ps.status = 'occupied' THEN 1 ELSE 0 END) as total_occupied,
        SUM(CASE WHEN ps.status = 'free' THEN 1 ELSE 0 END) as total_vacant,
        SUM(CASE WHEN ps.status = 'reserved' THEN 1 ELSE 0 END) as total_reserved
      FROM parking_spot ps
      INNER JOIN parking_section psec ON ps.parking_section_id = psec.parking_section_id
      INNER JOIN parking_area pa ON psec.parking_area_id = pa.parking_area_id
      WHERE pa.status = 'active'
    `;

    const totalStats = await db.query(totalQuery);
    const stats = totalStats[0];

    // Get vehicle type breakdown
    const vehicleTypesQuery = `
      SELECT 
        ps.spot_type as vehicle_type,
        COUNT(*) as total,
        SUM(CASE WHEN ps.status = 'occupied' THEN 1 ELSE 0 END) as occupied
      FROM parking_spot ps
      INNER JOIN parking_section psec ON ps.parking_section_id = psec.parking_section_id
      INNER JOIN parking_area pa ON psec.parking_area_id = pa.parking_area_id
      WHERE pa.status = 'active'
      GROUP BY ps.spot_type
    `;

    const vehicleTypes = await db.query(vehicleTypesQuery);

    res.json({
      success: true,
      data: {
        totalSpots: parseInt(stats.total_spots),
        totalOccupied: parseInt(stats.total_occupied),
        totalVacant: parseInt(stats.total_vacant),
        totalReserved: parseInt(stats.total_reserved),
        vehicleTypes: vehicleTypes.map(type => ({
          type: type.vehicle_type,
          total: parseInt(type.total),
          occupied: parseInt(type.occupied),
          available: parseInt(type.total) - parseInt(type.occupied)
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
});

// Get detailed information for a specific parking slot
router.get('/parking-slot/:slotId', authenticateToken, async (req, res) => {
  try {
    const { slotId } = req.params;
    console.log(`📊 Fetching details for parking slot: ${slotId}`);

    const query = `
      SELECT
        ps.parking_spot_id as id,
        ps.spot_number as slotId,
        ps.spot_type as vehicleType,
        ps.status,
        psec.section_name as section,
        pa.parking_area_name as areaName,
        pa.location
      FROM parking_spot ps
      INNER JOIN parking_section psec ON ps.parking_section_id = psec.parking_section_id
      INNER JOIN parking_area pa ON psec.parking_area_id = pa.parking_area_id
      WHERE ps.parking_spot_id = ? AND pa.status = 'active'
    `;

    const results = await db.query(query, [slotId]);

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Parking slot not found'
      });
    }

    const slot = results[0];
    console.log(`✅ Found slot details:`, slot);

    // Format the response
    const slotDetails = {
      id: slot.id,
      slotId: slot.slotId,
      vehicleType: slot.vehicleType,
      status: slot.status,
      section: slot.section,
      areaName: slot.areaName,
      location: slot.location
    };

    res.json({
      success: true,
      data: {
        slotDetails
      }
    });

  } catch (error) {
    console.error('Error fetching parking slot details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch parking slot details',
      error: error.message
    });
  }
});

// Get attendant profile information
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    console.log(`📊 Fetching attendant profile for user: ${req.user.user_id}`);

    const query = `
      SELECT
        u.user_id,
        u.email,
        u.first_name,
        u.last_name,
        u.hour_balance,
        t.account_type_name,
        u.created_at
      FROM users u
      LEFT JOIN types t ON u.user_type_id = t.type_id
      WHERE u.user_id = ? AND t.account_type_name = 'Attendant'
    `;

    const results = await db.query(query, [req.user.user_id]);

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Attendant profile not found'
      });
    }

    const user = results[0];
    console.log(`✅ Found attendant profile:`, user);

    // Format the response
    const attendantProfile = {
      attendantId: `ATT${user.user_id.toString().padStart(3, '0')}`,
      attendantName: `${user.first_name} ${user.last_name}`,
      email: user.email,
      hourBalance: user.hour_balance,
      accountType: user.account_type_name,
      assignedAreas: 'Floor 1 - Sections A, B, C', // This could be dynamic based on database
      createdAt: user.created_at
    };

    res.json({
      success: true,
      data: {
        attendantProfile
      }
    });

  } catch (error) {
    console.error('Error fetching attendant profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendant profile',
      error: error.message
    });
  }
});

// Get attendant notification preferences
router.get('/notification-settings', authenticateToken, async (req, res) => {
  try {
    console.log(`📊 Fetching notification settings for user: ${req.user.user_id}`);

    // For now, return default settings. In a real app, this would come from a user_preferences table
    const notificationSettings = {
      newReservationAlerts: true,
      lowCapacityAlerts: true,
      systemMaintenanceAlerts: true,
      emailNotifications: false,
      pushNotifications: true
    };

    res.json({
      success: true,
      data: {
        notificationSettings
      }
    });

  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification settings',
      error: error.message
    });
  }
});

// Update attendant notification preferences
router.put('/notification-settings', authenticateToken, async (req, res) => {
  try {
    const { notificationSettings } = req.body;
    console.log(`📊 Updating notification settings for user: ${req.user.user_id}`, notificationSettings);

    // For now, just return success. In a real app, this would save to a user_preferences table
    console.log('✅ Notification settings updated successfully');

    res.json({
      success: true,
      message: 'Notification settings updated successfully',
      data: {
        notificationSettings
      }
    });

  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification settings',
      error: error.message
    });
  }
});

// Start parking session via QR scan (attendant)
router.post('/start-parking-session', authenticateToken, async (req, res) => {
  try {
    const { qrCodeData } = req.body;
    console.log(`🚗 Starting parking session via QR scan: ${qrCodeData}`);

    // Parse QR code data to get reservation ID
    let reservationId;
    try {
      const qrData = JSON.parse(qrCodeData);
      reservationId = qrData.reservationId;
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code format'
      });
    }

    // Find the reservation by reservation ID
    const reservation = await db.query(`
      SELECT 
        r.reservation_id,
        r.user_id,
        r.vehicle_id,
        r.parking_spots_id,
        r.booking_status,
        r.start_time,
        v.plate_number,
        ps.spot_number,
        pa.parking_area_name,
        pa.location
      FROM reservations r
      JOIN vehicles v ON r.vehicle_id = v.vehicle_id
      JOIN parking_spot ps ON r.parking_spots_id = ps.parking_spot_id
      JOIN parking_section psec ON ps.parking_section_id = psec.parking_section_id
      JOIN parking_area pa ON psec.parking_area_id = pa.parking_area_id
      WHERE r.reservation_id = ? AND r.booking_status = 'reserved'
    `, [reservationId]);

    if (reservation.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found or already started'
      });
    }

    const reservationData = reservation[0];

    // Update booking status to active and set start time
    await db.query(`
      UPDATE reservations 
      SET booking_status = 'active', start_time = NOW()
      WHERE reservation_id = ?
    `, [reservationData.reservation_id]);

    // Update parking spot status from 'reserved' to 'occupied'
    await db.query(`
      UPDATE parking_spot 
      SET status = 'occupied'
      WHERE parking_spot_id = ? AND status = 'reserved'
    `, [reservationData.parking_spots_id]);

    console.log(`✅ Parking session started for reservation ${reservationData.reservation_id}`);

    res.json({
      success: true,
      message: 'Parking session started successfully',
      data: {
        reservationId: reservationData.reservation_id,
        vehiclePlate: reservationData.plate_number,
        spotNumber: reservationData.spot_number,
        areaName: reservationData.parking_area_name,
        location: reservationData.location,
        startTime: new Date().toISOString(),
        status: 'active'
      }
    });

  } catch (error) {
    console.error('Error starting parking session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start parking session',
      error: error.message
    });
  }
});

// End parking session via QR scan (attendant)
router.post('/end-parking-session', authenticateToken, async (req, res) => {
  try {
    const { qrCodeData } = req.body;
    console.log(`🛑 Ending parking session via QR scan: ${qrCodeData}`);

    // Parse QR code data to get reservation ID
    let reservationId;
    try {
      const qrData = JSON.parse(qrCodeData);
      reservationId = qrData.reservationId;
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code format'
      });
    }

    // Find the active reservation by reservation ID
    const reservation = await db.query(`
      SELECT 
        r.reservation_id,
        r.user_id,
        r.vehicle_id,
        r.parking_spots_id,
        r.booking_status,
        r.start_time,
        v.plate_number,
        ps.spot_number,
        pa.parking_area_name,
        pa.location
      FROM reservations r
      JOIN vehicles v ON r.vehicle_id = v.vehicle_id
      JOIN parking_spot ps ON r.parking_spots_id = ps.parking_spot_id
      JOIN parking_section psec ON ps.parking_section_id = psec.parking_section_id
      JOIN parking_area pa ON psec.parking_area_id = pa.parking_area_id
      WHERE r.reservation_id = ? AND r.booking_status = 'active'
    `, [reservationId]);

    if (reservation.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Active parking session not found'
      });
    }

    const reservationData = reservation[0];

    // Calculate duration
    const startTime = new Date(reservationData.start_time);
    const endTime = new Date();
    const durationMinutes = Math.ceil((endTime - startTime) / (1000 * 60));

    // Update booking status to completed and set end time
    await db.query(`
      UPDATE reservations 
      SET booking_status = 'completed', end_time = NOW()
      WHERE reservation_id = ?
    `, [reservationData.reservation_id]);

    // Free the parking spot
    await db.query(`
      UPDATE parking_spot 
      SET status = 'free'
      WHERE parking_spot_id = ?
    `, [reservationData.parking_spots_id]);

    console.log(`✅ Parking session ended for reservation ${reservationData.reservation_id}`);

    res.json({
      success: true,
      message: 'Parking session ended successfully',
      data: {
        reservationId: reservationData.reservation_id,
        vehiclePlate: reservationData.plate_number,
        spotNumber: reservationData.spot_number,
        areaName: reservationData.parking_area_name,
        location: reservationData.location,
        startTime: reservationData.start_time,
        endTime: endTime.toISOString(),
        durationMinutes: durationMinutes,
        status: 'completed'
      }
    });

  } catch (error) {
    console.error('Error ending parking session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end parking session',
      error: error.message
    });
  }
});

// Get current parking session status for a reservation (for real-time updates)
router.get('/parking-session-status/:reservationId', authenticateToken, async (req, res) => {
  try {
    const { reservationId } = req.params;
    console.log(`📊 Getting parking session status for reservation ID: ${reservationId}`);

    const reservation = await db.query(`
      SELECT 
        r.reservation_id,
        r.user_id,
        r.vehicle_id,
        r.parking_spots_id,
        r.booking_status,
        r.start_time,
        r.end_time,
        v.plate_number,
        ps.spot_number,
        pa.parking_area_name,
        pa.location
      FROM reservations r
      JOIN vehicles v ON r.vehicle_id = v.vehicle_id
      JOIN parking_spot ps ON r.parking_spots_id = ps.parking_spot_id
      JOIN parking_section psec ON ps.parking_section_id = psec.parking_section_id
      JOIN parking_area pa ON psec.parking_area_id = pa.parking_area_id
      WHERE r.reservation_id = ?
    `, [reservationId]);

    if (reservation.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    const reservationData = reservation[0];
    let durationMinutes = 0;

    if (reservationData.booking_status === 'active' && reservationData.start_time) {
      const startTime = new Date(reservationData.start_time);
      const currentTime = new Date();
      durationMinutes = Math.ceil((currentTime - startTime) / (1000 * 60));
    } else if (reservationData.booking_status === 'completed' && reservationData.start_time && reservationData.end_time) {
      const startTime = new Date(reservationData.start_time);
      const endTime = new Date(reservationData.end_time);
      durationMinutes = Math.ceil((endTime - startTime) / (1000 * 60));
    }

    res.json({
      success: true,
      data: {
        reservationId: reservationData.reservation_id,
        vehiclePlate: reservationData.plate_number,
        spotNumber: reservationData.spot_number,
        areaName: reservationData.parking_area_name,
        location: reservationData.location,
        status: reservationData.booking_status,
        startTime: reservationData.start_time,
        endTime: reservationData.end_time,
        durationMinutes: durationMinutes
      }
    });

  } catch (error) {
    console.error('Error getting parking session status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get parking session status',
      error: error.message
    });
  }
});

// Get parking session status by QR code (for real-time updates)
router.get('/parking-session-status-qr/:qrCode', authenticateToken, async (req, res) => {
  try {
    const { qrCode } = req.params;
    console.log(`📊 Getting parking session status for QR: ${qrCode}`);

    // Parse QR code data to get reservation ID
    let reservationId;
    try {
      const qrData = JSON.parse(qrCode);
      reservationId = qrData.reservationId;
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code format'
      });
    }

    const reservation = await db.query(`
      SELECT 
        r.reservation_id,
        r.user_id,
        r.vehicle_id,
        r.parking_spots_id,
        r.booking_status,
        r.start_time,
        r.end_time,
        v.plate_number,
        ps.spot_number,
        pa.parking_area_name,
        pa.location
      FROM reservations r
      JOIN vehicles v ON r.vehicle_id = v.vehicle_id
      JOIN parking_spot ps ON r.parking_spots_id = ps.parking_spot_id
      JOIN parking_section psec ON ps.parking_section_id = psec.parking_section_id
      JOIN parking_area pa ON psec.parking_area_id = pa.parking_area_id
      WHERE r.reservation_id = ?
    `, [reservationId]);

    if (reservation.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    const reservationData = reservation[0];
    let durationMinutes = 0;

    if (reservationData.booking_status === 'active' && reservationData.start_time) {
      const startTime = new Date(reservationData.start_time);
      const currentTime = new Date();
      durationMinutes = Math.ceil((currentTime - startTime) / (1000 * 60));
    } else if (reservationData.booking_status === 'completed' && reservationData.start_time && reservationData.end_time) {
      const startTime = new Date(reservationData.start_time);
      const endTime = new Date(reservationData.end_time);
      durationMinutes = Math.ceil((endTime - startTime) / (1000 * 60));
    }

    res.json({
      success: true,
      data: {
        reservationId: reservationData.reservation_id,
        vehiclePlate: reservationData.plate_number,
        spotNumber: reservationData.spot_number,
        areaName: reservationData.parking_area_name,
        location: reservationData.location,
        status: reservationData.booking_status,
        startTime: reservationData.start_time,
        endTime: reservationData.end_time,
        durationMinutes: durationMinutes
      }
    });

  } catch (error) {
    console.error('Error getting parking session status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get parking session status',
      error: error.message
    });
  }
});

// Get parking scan history for attendants
router.get('/scan-history', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Fetching parking scan history...');

    // Get all reservations with their scan timestamps
    const scanHistory = await db.query(`
      SELECT 
        CONCAT('scan_', r.reservation_id, '_start') as id,
        r.reservation_id,
        v.plate_number as vehiclePlate,
        v.vehicle_type as vehicleType,
        v.brand as vehicleBrand,
        pa.parking_area_name as parkingArea,
        ps.spot_number as parkingSlot,
        'start' as scanType,
        r.start_time as scanTime,
        CONCAT(u.first_name, ' ', u.last_name) as attendantName,
        t.account_type_name as userType,
        r.booking_status as status
      FROM reservations r
      JOIN vehicles v ON r.vehicle_id = v.vehicle_id
      JOIN parking_spot ps ON r.parking_spots_id = ps.parking_spot_id
      JOIN parking_section psec ON ps.parking_section_id = psec.parking_section_id
      JOIN parking_area pa ON psec.parking_area_id = pa.parking_area_id
      JOIN users u ON r.user_id = u.user_id
      JOIN types t ON u.user_type_id = t.type_id
      WHERE r.start_time IS NOT NULL
      
      UNION ALL
      
      SELECT 
        CONCAT('scan_', r.reservation_id, '_end') as id,
        r.reservation_id,
        v.plate_number as vehiclePlate,
        v.vehicle_type as vehicleType,
        v.brand as vehicleBrand,
        pa.parking_area_name as parkingArea,
        ps.spot_number as parkingSlot,
        'end' as scanType,
        r.end_time as scanTime,
        CONCAT(u.first_name, ' ', u.last_name) as attendantName,
        t.account_type_name as userType,
        r.booking_status as status
      FROM reservations r
      JOIN vehicles v ON r.vehicle_id = v.vehicle_id
      JOIN parking_spot ps ON r.parking_spots_id = ps.parking_spot_id
      JOIN parking_section psec ON ps.parking_section_id = psec.parking_section_id
      JOIN parking_area pa ON psec.parking_area_id = pa.parking_area_id
      JOIN users u ON r.user_id = u.user_id
      JOIN types t ON u.user_type_id = t.type_id
      WHERE r.end_time IS NOT NULL
      
      ORDER BY scanTime DESC
      LIMIT 100
    `);

    console.log(`✅ Found ${scanHistory.length} scan records`);

    res.json({
      success: true,
      data: {
        scans: scanHistory
      }
    });

  } catch (error) {
    console.error('Error fetching scan history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scan history',
      error: error.message
    });
  }
});

module.exports = router;
