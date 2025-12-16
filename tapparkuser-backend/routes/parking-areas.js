const express = require('express');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { logUserActivity, ActionTypes } = require('../utils/userLogger');

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
    const { vehicleType, includeAll } = req.query; // Optional vehicle type filter and includeAll flag
    
    console.log(`🔍 Getting spots for area ${areaId}, vehicle type: ${vehicleType}, includeAll: ${includeAll}`);
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
      WHERE psec.parking_area_id = ?
    `;

    const params = [areaId];

    // Only filter by status if includeAll is not set (for backward compatibility)
    if (!includeAll || includeAll === 'false') {
      query += ` AND ps.status = 'available'`;
    }

    // Filter by vehicle type if provided
    if (vehicleType) {
      // Map vehicle types to spot types for compatibility (case-insensitive)
      let normalizedVehicleType = vehicleType.toLowerCase().trim();
      let spotType;
      
      // Map bicycle variants to bike
      if (normalizedVehicleType === 'bicycle' || normalizedVehicleType === 'bike' || normalizedVehicleType === 'ebike') {
        spotType = 'bike';
      }
      // Map car variants (should already be 'car')
      else if (normalizedVehicleType === 'car' || normalizedVehicleType === 'automobile' || normalizedVehicleType === 'auto') {
        spotType = 'car';
      }
      // Map motorcycle variants
      else if (normalizedVehicleType === 'motorcycle' || normalizedVehicleType === 'motor' || normalizedVehicleType === 'moto') {
        spotType = 'motorcycle';
      }
      // Default: use the normalized vehicle type as-is
      else {
        spotType = normalizedVehicleType;
      }
      
      console.log(`🔍 Filtering spots for vehicle type: ${vehicleType} -> spot type: ${spotType}`);
      query += ` AND LOWER(TRIM(ps.spot_type)) = ?`;
      params.push(spotType.toLowerCase());
    }

    query += ` ORDER BY ps.spot_number`;

    const spots = await db.query(query, params);
    
    console.log(`📋 Found ${spots.length} spots:`, spots.map(s => `${s.spot_number} (${s.status}, ${s.spot_type})`));

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

// Get all parking spots with statuses for layout visualization
router.get('/areas/:areaId/spots-status', authenticateToken, async (req, res) => {
  try {
    const { areaId } = req.params;
    const userId = req.user.user_id;
    
    console.log(`📊 Getting all spot statuses for area ${areaId} (for layout visualization)`);

    // Query to get all spots with their statuses, and check if current user has booked each spot
    const query = `
      SELECT 
        ps.parking_spot_id as id,
        ps.spot_number,
        ps.status,
        ps.spot_type,
        psec.section_name,
        CASE 
          WHEN EXISTS (
            SELECT 1 
            FROM reservations r 
            WHERE r.parking_spots_id = ps.parking_spot_id 
            AND r.user_id = ?
            AND r.booking_status IN ('reserved', 'active')
          ) THEN 1
          ELSE 0
        END as is_user_booked
      FROM parking_spot ps
      JOIN parking_section psec ON ps.parking_section_id = psec.parking_section_id
      WHERE psec.parking_area_id = ?
      ORDER BY ps.spot_number
    `;

    const spots = await db.query(query, [userId, areaId]);
    
    console.log(`📋 Found ${spots.length} spots with statuses`);

    res.json({
      success: true,
      data: {
        spots
      }
    });

  } catch (error) {
    console.error('Get parking spots status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch parking spots status'
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

    // Get vehicle type to validate compatibility (before transaction)
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

    const areaDetails = await db.query(
      'SELECT parking_area_name, location FROM parking_area WHERE parking_area_id = ?',
      [areaId]
    );

    if (areaDetails.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Parking area not found'
      });
    }

    // Use transaction with row-level locking to prevent race conditions
    // This ensures only one user can book the spot at a time
    let connection = null;
    try {
      if (!db.connection) {
        await db.connect();
      }

      // Get a connection from the pool for transaction
      connection = await db.connection.getConnection();
      await connection.beginTransaction();

      // Lock the spot row and check availability atomically
      const [lockedSpots] = await connection.execute(
        'SELECT status, spot_type, spot_number FROM parking_spot WHERE parking_spot_id = ? FOR UPDATE',
        [spotId]
      );

      if (lockedSpots.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: 'Parking spot not found'
        });
      }

      const spot = lockedSpots[0];

      // Check if spot is available
      if (spot.status !== 'available') {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: 'Parking spot is no longer available',
          errorCode: 'SPOT_UNAVAILABLE'
        });
      }

      const vehicleType = vehicleDetails[0].vehicle_type;
      const spotType = spot.spot_type;
      
      console.log('🔍 Vehicle type from DB:', vehicleType);
      console.log('🔍 Spot type from DB:', spotType);

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
        await connection.rollback();
        connection.release();
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

      // Atomically update spot status to 'reserved' (only if still available)
      // This prevents double booking even if two requests pass the check above
      const [updateResult] = await connection.execute(
        'UPDATE parking_spot SET status = ? WHERE parking_spot_id = ? AND status = ?',
        ['reserved', spotId, 'available']
      );

      // Check if the update actually affected a row
      if (updateResult.affectedRows === 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: 'Parking spot was just booked by another user. Please try a different spot.',
          errorCode: 'SPOT_ALREADY_BOOKED'
        });
      }

      // Generate unique QR key before creating reservation
      const qrKey = uuidv4();
      
      // Create reservation within the same transaction
      // Try to insert with qr_key, fallback if column doesn't exist
      let insertResult;
      try {
        [insertResult] = await connection.execute(`
          INSERT INTO reservations (
            user_id, vehicle_id, parking_spots_id, time_stamp, start_time, 
            booking_status, QR, qr_key
          ) VALUES (?, ?, ?, NOW(), NULL, 'reserved', '', ?)
        `, [req.user.user_id, vehicleId, spotId, qrKey]);
      } catch (insertError) {
        // If qr_key column doesn't exist, add it and retry
        if (insertError.message && insertError.message.includes('Unknown column')) {
          console.log('⚠️  qr_key column not found, adding it now...');
          try {
            await connection.execute(`
              ALTER TABLE reservations 
              ADD COLUMN qr_key VARCHAR(255) UNIQUE NULL AFTER QR
            `);
            console.log('✅ Added qr_key column to reservations table');
          } catch (alterError) {
            // Column might have been added by another request, try insert again
            if (!alterError.message.includes('Duplicate column name')) {
              throw alterError;
            }
          }
          // Retry insert with qr_key
          [insertResult] = await connection.execute(`
            INSERT INTO reservations (
              user_id, vehicle_id, parking_spots_id, time_stamp, start_time, 
              booking_status, QR, qr_key
            ) VALUES (?, ?, ?, NOW(), NULL, 'reserved', '', ?)
          `, [req.user.user_id, vehicleId, spotId, qrKey]);
        } else {
          throw insertError;
        }
      }

      const reservationId = insertResult.insertId;
      
      // Generate QR code data with only qr_key
      // IMPORTANT: Only qr_key is included in the QR code for validation
      const qrData = {
        qr_key: qrKey
      };
      
      // Generate QR code as data URL
      // The QR code contains only: qr_key and reservation_id
      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      // Update the reservation with the QR code (qr_key already set in INSERT)
      await connection.execute(
        'UPDATE reservations SET QR = ? WHERE reservation_id = ?',
        [qrCodeDataURL, reservationId]
      );

      // Commit the transaction
      await connection.commit();
      connection.release();

      // Log parking booking (outside transaction)
      await logUserActivity(
        req.user.user_id,
        ActionTypes.PARKING_BOOK,
        `Parking spot booked: ${spot.spot_number} at ${areaDetails[0].parking_area_name} for vehicle ${vehicleDetails[0].plate_number}`,
        reservationId
      );

      res.json({
        success: true,
        data: {
          reservationId,
          qrCode: qrCodeDataURL,
          qrKey: qrKey,
          message: 'Parking spot booked successfully',
          bookingDetails: {
            reservationId,
            qrCode: qrCodeDataURL,
            qrKey: qrKey,
            vehiclePlate: vehicleDetails[0].plate_number,
            vehicleType: vehicleDetails[0].vehicle_type,
            vehicleBrand: vehicleDetails[0].brand,
            areaName: areaDetails[0].parking_area_name,
            areaLocation: areaDetails[0].location,
            spotNumber: spot.spot_number,
            spotType: spot.spot_type,
            startTime: null, // Will be set when attendant scans QR
            status: 'reserved'
          }
        }
      });

    } catch (transactionError) {
      if (connection) {
        await connection.rollback();
        connection.release();
      }
      throw transactionError;
    }

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
        pl.parking_layout_id,
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
        // Handle both string and already-parsed object cases
        let layoutData;
        if (typeof area.layout_data === 'string') {
          layoutData = JSON.parse(area.layout_data);
        } else {
          layoutData = area.layout_data;
        }
        
        if (layoutData && layoutData.svg_data) {
          layoutSvg = layoutData.svg_data;
          hasLayout = true;
          console.log('✅ Successfully extracted SVG, length:', layoutSvg.length);
        } else {
          console.log('⚠️ Layout data exists but no svg_data field found');
        }
      } catch (parseError) {
        // Try to extract SVG directly using regex as fallback
        if (area.layout_data && typeof area.layout_data === 'string') {
          // Method 1: Try to find SVG tag directly (most reliable for malformed JSON)
          // This works best when JSON is broken but SVG content is intact
          const svgMatch = area.layout_data.match(/<svg[\s\S]*?<\/svg>/);
          if (svgMatch && svgMatch[0].length > 100) {
            layoutSvg = svgMatch[0];
            hasLayout = true;
            // Silent success - no console log needed
          } else {
            // Method 2: Try to find svg_data field with proper handling of escaped quotes
            let svgDataMatch = area.layout_data.match(/"svg_data"\s*:\s*"((?:[^"\\]|\\.)*)"/);
            
            if (svgDataMatch && svgDataMatch[1].length > 100) {
              // Unescape the SVG string from method 2
              layoutSvg = svgDataMatch[1]
                .replace(/\\"/g, '"')
                .replace(/\\n/g, '\n')
                .replace(/\\t/g, '\t')
                .replace(/\\r/g, '\r')
                .replace(/\\\\/g, '\\');
              hasLayout = true;
              // Silent success - no console log needed
            } else {
              // Method 3: Manual parsing as last resort (only use if substantial)
              const svgDataStart = area.layout_data.indexOf('"svg_data"');
              if (svgDataStart !== -1) {
                const colonIndex = area.layout_data.indexOf(':', svgDataStart);
                if (colonIndex !== -1) {
                  let searchStart = colonIndex + 1;
                  while (searchStart < area.layout_data.length && /\s/.test(area.layout_data[searchStart])) {
                    searchStart++;
                  }
                  const valueStart = area.layout_data.indexOf('"', searchStart) + 1;
                  if (valueStart > 0 && valueStart < area.layout_data.length) {
                    let valueEnd = valueStart;
                    let escaped = false;
                    while (valueEnd < area.layout_data.length) {
                      const char = area.layout_data[valueEnd];
                      if (char === '\\' && !escaped) {
                        escaped = true;
                        valueEnd++;
                      } else if (char === '"' && !escaped) {
                        break;
                      } else {
                        escaped = false;
                        valueEnd++;
                      }
                    }
                    if (valueEnd > valueStart) {
                      const svgString = area.layout_data.substring(valueStart, valueEnd);
                      const unescapedSvg = svgString
                        .replace(/\\"/g, '"')
                        .replace(/\\n/g, '\n')
                        .replace(/\\t/g, '\t')
                        .replace(/\\r/g, '\r')
                        .replace(/\\\\/g, '\\');
                      // Only use if it's substantial (more than 100 chars)
                      if (unescapedSvg.length > 100) {
                        layoutSvg = unescapedSvg;
                        hasLayout = true;
                        // Silent success - no console log needed
                      }
                    }
                  }
                }
              }
            }
          }
          
          if (!hasLayout) {
            // Only log as error if we couldn't extract anything
            const errorPos = parseError.message.match(/position (\d+)/)?.[1] || 'unknown';
            console.error('❌ Error parsing layout data:', parseError.message);
            console.error('📄 Error at position:', errorPos);
            console.error('❌ Could not extract SVG from malformed JSON');
          }
        }
      }
    }

    res.json({
      success: true,
      data: {
        areaId: area.parking_area_id,
        areaName: area.parking_area_name,
        location: area.location,
        layoutId: area.parking_layout_id || null,
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
        r.end_time,
        r.booking_status,
        r.QR,
        r.qr_key,
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
    
    console.log('🔍 SQL Query result - bookingDetails[0]:', bookingDetails[0]);

    if (bookingDetails.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or does not belong to user'
      });
    }

    const booking = bookingDetails[0];
    
    console.log('🔍 Raw booking.qr_key from database:', booking.qr_key);
    console.log('🔍 Type of booking.qr_key:', typeof booking.qr_key);
    
    // Ensure qr_key is a clean UUID string, not JSON
    let qrKey = booking.qr_key;
    if (qrKey) {
      // Convert to string and trim
      qrKey = String(qrKey).trim();
      
      // If qr_key appears to be JSON, try to extract the actual UUID
      // This handles cases where old data might have JSON stored in qr_key
      if (qrKey.startsWith('{') || qrKey.startsWith('[')) {
        try {
          const parsed = JSON.parse(qrKey);
          // If it parsed to an object, it's not a valid UUID
          if (typeof parsed === 'object') {
            console.warn('⚠️  qr_key contains JSON instead of UUID:', parsed);
            qrKey = null;
          }
        } catch (e) {
          // Parse failed but starts with {, still not valid
          console.warn('⚠️  qr_key starts with { but is not valid JSON');
          qrKey = null;
        }
      } else {
        // Not JSON, use as is (should be UUID)
        console.log('✅ qr_key appears to be valid (not JSON):', qrKey);
      }
    } else {
      console.warn('⚠️  qr_key is null or undefined in database for reservation:', reservationId);
    }

    // Check for penalty if reservation is completed
    let penaltyInfo = null;
    if (booking.booking_status === 'completed' && booking.start_time && booking.end_time) {
      // Get the most recent penalty for this reservation (if any)
      // We'll check if there's a penalty record created around the time of completion
      const penaltyRecord = await db.query(`
        SELECT penalty_time
        FROM penalty
        WHERE user_id = ?
        ORDER BY penalty_id DESC
        LIMIT 1
      `, [req.user.user_id]);

      if (penaltyRecord.length > 0) {
        penaltyInfo = {
          penaltyHours: penaltyRecord[0].penalty_time,
          hasPenalty: true
        };
      }
    }

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
          startTime: booking.start_time,
          endTime: booking.end_time || null
        },
        bookingStatus: booking.booking_status,
        qrCode: booking.QR,
        qrKey: qrKey || null,
        penaltyInfo: penaltyInfo
      }
    });
    
    console.log('📱 Booking details response - qrKey:', qrKey);

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
        SET status = 'available'
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
