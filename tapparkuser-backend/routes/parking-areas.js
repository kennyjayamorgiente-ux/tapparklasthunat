const express = require('express');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all parking areas
router.get('/areas', async (req, res) => {
  try {
    const areas = await db.query(`
      SELECT 
        parking_area_id as id,
        parking_area_name as name,
        location,
        status,
        num_of_floors
      FROM parking_area 
      WHERE status = 'active'
      ORDER BY parking_area_name
    `);

    res.json({
      success: true,
      data: {
        areas
      }
    });

  } catch (error) {
    console.error('Get parking areas error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch parking areas'
    });
  }
});

// Get parking spots for a specific area
router.get('/areas/:areaId/spots', async (req, res) => {
  try {
    const { areaId } = req.params;
    const { vehicleType } = req.query; // Optional vehicle type filter
    
    console.log(`🔍 Getting spots for area ${areaId}, vehicle type: ${vehicleType}`);
    console.log(`🔍 All query params:`, req.query);
    console.log(`🔍 Full URL:`, req.originalUrl);

    let query = `
      SELECT 
        ps.parking_spot_id as id,
        ps.spot_number,
        ps.status,
        ps.spot_type,
        psec.section_name
      FROM parking_spot ps
      JOIN parking_section psec ON ps.parking_section_id = psec.parking_section_id
      WHERE psec.parking_area_id = ? AND ps.status = 'free'
    `;

    const params = [areaId];

    // Filter by vehicle type if provided
    if (vehicleType) {
      // Map vehicle types to spot types for compatibility
      let spotType = vehicleType;
      if (vehicleType === 'bicycle') {
        spotType = 'bike';
      } else if (vehicleType === 'ebike') {
        spotType = 'bike';
      }
      
      console.log(`🔍 Filtering spots for vehicle type: ${vehicleType} -> spot type: ${spotType}`);
      query += ` AND ps.spot_type = ?`;
      params.push(spotType);
    }

    query += ` ORDER BY ps.spot_number`;

    const spots = await db.query(query, params);
    
    console.log(`📋 Found ${spots.length} spots:`, spots.map(s => `${s.spot_number} (${s.spot_type})`));

    res.json({
      success: true,
      data: {
        spots
      }
    });

  } catch (error) {
    console.error('Get parking spots error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch parking spots'
    });
  }
});

// Book a parking spot
router.post('/book', authenticateToken, async (req, res) => {
  try {
    const { vehicleId, spotId, areaId } = req.body;

    // Validate required fields
    if (!vehicleId || !spotId || !areaId) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle ID, spot ID, and area ID are required'
      });
    }

    // Check if vehicle belongs to user
    const vehicles = await db.query(
      'SELECT vehicle_id FROM vehicles WHERE vehicle_id = ? AND user_id = ?',
      [vehicleId, req.user.user_id]
    );

    if (vehicles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle not found or does not belong to user'
      });
    }

    // Check if spot is still available and get spot type
    const spots = await db.query(
      'SELECT status, spot_type FROM parking_spot WHERE parking_spot_id = ?',
      [spotId]
    );

    if (spots.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Parking spot not found'
      });
    }

    if (spots[0].status !== 'free') {
      return res.status(400).json({
        success: false,
        message: 'Parking spot is no longer available'
      });
    }

    // Get vehicle type to validate compatibility
    const vehicleDetails = await db.query(
      'SELECT plate_number, vehicle_type, brand FROM vehicles WHERE vehicle_id = ?',
      [vehicleId]
    );

    if (vehicleDetails.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    const vehicleType = vehicleDetails[0].vehicle_type;
    const spotType = spots[0].spot_type;
    
    console.log('🔍 Vehicle type from DB:', vehicleType);
    console.log('🔍 Spot type from DB:', spotType);
    console.log('🔍 Vehicle details:', vehicleDetails[0]);
    console.log('🔍 Spot details:', spots[0]);

    // Map vehicle types to spot types for compatibility
    let expectedSpotType = vehicleType.toLowerCase();
    if (vehicleType.toLowerCase() === 'bicycle') {
      expectedSpotType = 'bike';
    } else if (vehicleType.toLowerCase() === 'ebike') {
      expectedSpotType = 'bike';
    }
    
    console.log('🔍 Expected spot type:', expectedSpotType);
    console.log('🔍 Actual spot type:', spotType);
    console.log('🔍 Types match?', expectedSpotType === spotType.toLowerCase());

    // Validate vehicle type compatibility with spot type (case-insensitive)
    if (expectedSpotType !== spotType.toLowerCase()) {
      console.log('❌ Type mismatch - rejecting booking');
      return res.status(400).json({
        success: false,
        errorCode: 'VEHICLE_TYPE_MISMATCH',
        message: `This parking spot is for ${spotType}s only. Your vehicle is a ${vehicleType}.`,
        data: {
          vehicleType: vehicleType,
          spotType: spotType,
          expectedSpotType: expectedSpotType
        }
      });
    }
    
    console.log('✅ Type validation passed');

    const areaDetails = await db.query(
      'SELECT parking_area_name, location FROM parking_area WHERE parking_area_id = ?',
      [areaId]
    );

    const spotDetails = await db.query(
      'SELECT spot_number, spot_type FROM parking_spot WHERE parking_spot_id = ?',
      [spotId]
    );

    if (vehicleDetails.length === 0 || areaDetails.length === 0 || spotDetails.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle, area, or spot information'
      });
    }

    // Update spot status to 'reserved' to prevent double booking
    await db.query(
      'UPDATE parking_spot SET status = ? WHERE parking_spot_id = ?',
      ['reserved', spotId]
    );

    // Create reservation with detailed information
    const startTime = new Date();
    
    // Generate QR code data with reservation information
    const qrData = {
      reservationId: null, // Will be set after insert
      userId: req.user.user_id,
      vehicleId: vehicleId,
      spotId: spotId,
      areaId: areaId,
      plateNumber: vehicleDetails[0].plate_number,
      parkingArea: areaDetails[0].parking_area_name,
      spotNumber: spotDetails[0].spot_number,
      timestamp: Date.now()
    };
    
    const insertResult = await db.query(`
      INSERT INTO reservations (
        user_id, vehicle_id, parking_spots_id, time_stamp, start_time, 
        booking_status, QR
      ) VALUES (?, ?, ?, NOW(), NULL, 'reserved', '')
    `, [req.user.user_id, vehicleId, spotId]);

    const reservationId = insertResult.insertId;
    
    // Update QR data with actual reservation ID
    qrData.reservationId = reservationId;
    
    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    // Update the reservation with the QR code
    await db.query(
      'UPDATE reservations SET QR = ? WHERE reservation_id = ?',
      [qrCodeDataURL, reservationId]
    );

    res.json({
      success: true,
      data: {
        reservationId,
        qrCode: qrCodeDataURL,
        message: 'Parking spot booked successfully',
        bookingDetails: {
          reservationId,
          qrCode: qrCodeDataURL,
          vehiclePlate: vehicleDetails[0].plate_number,
          vehicleType: vehicleDetails[0].vehicle_type,
          vehicleBrand: vehicleDetails[0].brand,
          areaName: areaDetails[0].parking_area_name,
          areaLocation: areaDetails[0].location,
          spotNumber: spotDetails[0].spot_number,
          spotType: spotDetails[0].spot_type,
          startTime: null, // Will be set when attendant scans QR
          status: 'reserved'
        }
      }
    });

  } catch (error) {
    console.error('Book parking spot error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to book parking spot'
    });
  }
});

// Timer is now purely local - no server-side timer needed
// Timer starts/stops only through QR scans

// Get parking area layout info (AJAX approach)
router.get('/area/:areaId/layout', authenticateToken, async (req, res) => {
  try {
    const { areaId } = req.params;

    const result = await db.query(`
      SELECT 
        pa.parking_area_id,
        pa.parking_area_name,
        pa.location,
        pl.layout_data,
        pl.floor
      FROM parking_area pa
      LEFT JOIN parking_layout pl ON pa.parking_area_id = pl.parking_area_id
      WHERE pa.parking_area_id = ? AND pa.status = 'active'
      ORDER BY pl.created_at DESC, pl.parking_layout_id DESC
      LIMIT 1
    `, [areaId]);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Parking area not found'
      });
    }

    const area = result[0];
    
    // Parse the layout data to extract SVG
    let layoutSvg = '';
    let hasLayout = false;
    
    if (area.layout_data) {
      try {
        const layoutData = JSON.parse(area.layout_data);
        if (layoutData.svg_data) {
          layoutSvg = layoutData.svg_data;
          hasLayout = true;
        }
      } catch (parseError) {
        console.error('Error parsing layout data:', parseError);
      }
    }

    res.json({
      success: true,
      data: {
        areaId: area.parking_area_id,
        areaName: area.parking_area_name,
        location: area.location,
        layoutName: `${area.parking_area_name}_floor_${area.floor || 1}`,
        layoutSvg: layoutSvg,
        hasLayout: hasLayout,
        floor: area.floor || 1
      }
    });

  } catch (error) {
    console.error('Get parking area layout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch parking area layout'
    });
  }
});

// Serve SVG files statically (AJAX approach)
router.get('/layout/:layoutName', (req, res) => {
  try {
    const { layoutName } = req.params;
    
    // Security: Only allow specific layout names
    const allowedLayouts = ['FPAParking', 'FUMainParking'];
    if (!allowedLayouts.includes(layoutName)) {
      return res.status(404).json({
        success: false,
        message: 'Layout not found'
      });
    }

    const svgPath = path.join(__dirname, `../../PARKINGLAYOUT-1,PARKINGLAYOUT-2/${layoutName}.svg`);
    
    // Check if file exists
    if (!fs.existsSync(svgPath)) {
      return res.status(404).json({
        success: false,
        message: 'SVG file not found'
      });
    }

    // Set appropriate headers for SVG
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    // Send the SVG file
    res.sendFile(svgPath);

  } catch (error) {
    console.error('Serve SVG layout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to serve layout SVG'
    });
  }
});

// Get parking spot ID from reservation ID
router.get('/reservation/:reservationId/parking-spot-id', authenticateToken, async (req, res) => {
  try {
    const { reservationId } = req.params;
    
    const result = await db.query(`
      SELECT r.parking_spots_id 
      FROM reservations r
      WHERE r.reservation_id = ? AND r.user_id = ?
    `, [reservationId, req.user.user_id]);
    
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found or does not belong to user'
      });
    }
    
    res.json({
      success: true,
      data: {
        parkingSpotId: result[0].parking_spots_id
      }
    });
    
  } catch (error) {
    console.error('Get parking spot ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get parking spot ID'
    });
  }
});

// Get booking details by reservation ID
router.get('/booking/:reservationId', authenticateToken, async (req, res) => {
  try {
    const { reservationId } = req.params;

    // Get complete booking details with all related information
    const bookingDetails = await db.query(`
      SELECT 
        r.reservation_id,
        r.time_stamp,
        r.start_time,
        r.booking_status,
        r.QR,
        u.first_name,
        u.last_name,
        u.email,
        v.plate_number,
        v.vehicle_type,
        v.brand,
        v.color,
        pa.parking_area_id,
        pa.parking_area_name,
        pa.location,
        ps.parking_spot_id,
        ps.spot_number,
        ps.spot_type,
        psec.section_name
      FROM reservations r
      JOIN users u ON r.user_id = u.user_id
      JOIN vehicles v ON r.vehicle_id = v.vehicle_id
      JOIN parking_spot ps ON r.parking_spots_id = ps.parking_spot_id
      JOIN parking_section psec ON ps.parking_section_id = psec.parking_section_id
      JOIN parking_area pa ON psec.parking_area_id = pa.parking_area_id
      WHERE r.reservation_id = ? AND r.user_id = ?
    `, [reservationId, req.user.user_id]);

    if (bookingDetails.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or does not belong to user'
      });
    }

    const booking = bookingDetails[0];

    res.json({
      success: true,
      data: {
        reservationId: booking.reservation_id,
        displayName: `${booking.first_name} ${booking.last_name}`,
        userEmail: booking.email,
        vehicleDetails: {
          plateNumber: booking.plate_number,
          vehicleType: booking.vehicle_type,
          brand: booking.brand,
          color: booking.color
        },
        parkingArea: {
          id: booking.parking_area_id,
          name: booking.parking_area_name,
          location: booking.location
        },
        parkingSlot: {
          parkingSpotId: booking.parking_spot_id,
          spotNumber: booking.spot_number,
          spotType: booking.spot_type,
          sectionName: booking.section_name
        },
        timestamps: {
          bookingTime: booking.time_stamp,
          startTime: booking.start_time
        },
        bookingStatus: booking.booking_status,
        qrCode: booking.QR
      }
    });

  } catch (error) {
    console.error('Get booking details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking details'
    });
  }
});

// Get current booking (reserved or active) for the logged-in user
router.get('/current-booking', authenticateToken, async (req, res) => {
  try {
    const currentBooking = await db.query(`
      SELECT 
        r.reservation_id,
        r.time_stamp,
        r.start_time,
        r.booking_status,
        r.QR,
        v.plate_number,
        v.vehicle_type,
        pa.parking_area_name,
        pa.location,
        ps.spot_number,
        ps.spot_type,
        psec.section_name
      FROM reservations r
      JOIN vehicles v ON r.vehicle_id = v.vehicle_id
      JOIN parking_spot ps ON r.parking_spots_id = ps.parking_spot_id
      JOIN parking_section psec ON ps.parking_section_id = psec.parking_section_id
      JOIN parking_area pa ON psec.parking_area_id = pa.parking_area_id
      WHERE r.user_id = ? AND r.booking_status IN ('reserved', 'active')
      ORDER BY r.time_stamp DESC
      LIMIT 1
    `, [req.user.user_id]);

    if (currentBooking.length === 0) {
      return res.json({
        success: true,
        data: {
          booking: null
        }
      });
    }

    const booking = currentBooking[0];

    res.json({
      success: true,
      data: {
        booking: {
          reservationId: booking.reservation_id,
          bookingStatus: booking.booking_status,
          location_name: booking.parking_area_name,
          spot_number: booking.spot_number,
          plate_number: booking.plate_number,
          vehicle_type: booking.vehicle_type,
          spot_type: booking.spot_type,
          section_name: booking.section_name,
          location: booking.location,
          time_stamp: booking.time_stamp,
          start_time: booking.start_time,
          qr_code: booking.QR
        }
      }
    });

  } catch (error) {
    console.error('Get current booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch current booking'
    });
  }
});

// Get all active bookings for the logged-in user
router.get('/my-bookings', authenticateToken, async (req, res) => {
  try {
    const bookings = await db.query(`
      SELECT 
        r.reservation_id,
        r.time_stamp,
        r.start_time,
        r.booking_status,
        r.QR,
        u.first_name,
        u.last_name,
        u.email,
        v.plate_number,
        v.vehicle_type,
        v.brand,
        v.color,
        pa.parking_area_id,
        pa.parking_area_name,
        pa.location,
        ps.spot_number,
        ps.spot_type,
        psec.section_name
      FROM reservations r
      JOIN users u ON r.user_id = u.user_id
      JOIN vehicles v ON r.vehicle_id = v.vehicle_id
      JOIN parking_spot ps ON r.parking_spots_id = ps.parking_spot_id
      JOIN parking_section psec ON ps.parking_section_id = psec.parking_section_id
      JOIN parking_area pa ON psec.parking_area_id = pa.parking_area_id
      WHERE r.user_id = ?
      ORDER BY r.time_stamp DESC
    `, [req.user.user_id]);

    const formattedBookings = bookings.map(booking => ({
      reservationId: booking.reservation_id,
      displayName: `${booking.first_name} ${booking.last_name}`,
      userEmail: booking.email,
      vehicleDetails: {
        plateNumber: booking.plate_number,
        vehicleType: booking.vehicle_type,
        brand: booking.brand,
        color: booking.color
      },
      parkingArea: {
        id: booking.parking_area_id,
        name: booking.parking_area_name,
        location: booking.location
      },
      parkingSlot: {
        spotNumber: booking.spot_number,
        spotType: booking.spot_type,
        sectionName: booking.section_name
      },
      timestamps: {
        bookingTime: booking.time_stamp,
        startTime: booking.start_time
      },
      bookingStatus: booking.booking_status,
      qrCode: booking.QR
    }));

    res.json({
      success: true,
      data: {
        bookings: formattedBookings
      }
    });

  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user bookings'
    });
  }
});

// End parking session - update booking status to inactive and free the spot
router.put('/end-session/:reservationId', authenticateToken, async (req, res) => {
  try {
    const { reservationId } = req.params;
    const userId = req.user.user_id;

    try {
      // Get the reservation details
      const reservation = await db.query(`
        SELECT 
          r.reservation_id,
          r.user_id,
          r.parking_spots_id,
          r.booking_status
        FROM reservations r
        WHERE r.reservation_id = ? AND r.user_id = ?
      `, [reservationId, userId]);

      if (reservation.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Reservation not found'
        });
      }

      const reservationData = reservation[0];

      // Update booking status to completed
      await db.query(`
        UPDATE reservations 
        SET booking_status = 'completed', end_time = NOW()
        WHERE reservation_id = ?
      `, [reservationId]);

      // Free the parking spot (set status to free)
      await db.query(`
        UPDATE parking_spot 
        SET status = 'free'
        WHERE parking_spot_id = ?
      `, [reservationData.parking_spots_id]);

      res.json({
        success: true,
        message: 'Parking session ended successfully',
        data: {
          reservationId: reservationId,
          status: 'completed',
          spotFreed: true
        }
      });

    } catch (error) {
      throw error;
    }

  } catch (error) {
    console.error('End parking session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end parking session'
    });
  }
});

module.exports = router;
