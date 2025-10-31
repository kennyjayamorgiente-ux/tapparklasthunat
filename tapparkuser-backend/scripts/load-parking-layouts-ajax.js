const fs = require('fs');
const path = require('path');
const db = require('../config/database');

/**
 * AJAX-based approach: Store SVG file paths instead of content
 * This allows dynamic loading of SVG files via AJAX/fetch
 */

async function setupAjaxParkingLayouts() {
  try {
    console.log('🚀 Setting up AJAX-based parking layouts...');

    // Define the mapping of parking areas to their layout files
    const layoutMappings = [
      {
        parkingAreaId: 1, // Adjust these IDs based on your actual parking areas
        layoutName: 'FPAParking',
        svgFilePath: '/assets/layouts/FPAParking.svg', // Web-accessible path
        localFilePath: path.join(__dirname, '../../PARKINGLAYOUT-1,PARKINGLAYOUT-2/FPAParking.svg')
      },
      {
        parkingAreaId: 2, // Adjust these IDs based on your actual parking areas
        layoutName: 'FUMainParking', 
        svgFilePath: '/assets/layouts/FUMainParking.svg', // Web-accessible path
        localFilePath: path.join(__dirname, '../../PARKINGLAYOUT-1,PARKINGLAYOUT-2/FUMainParking.svg')
      }
    ];

    for (const mapping of layoutMappings) {
      try {
        // Check if local SVG file exists
        if (!fs.existsSync(mapping.localFilePath)) {
          console.log(`⚠️  SVG file not found: ${mapping.localFilePath}`);
          continue;
        }

        // Check if parking area exists
        const areaCheck = await db.query(
          'SELECT parking_area_id, parking_area_name FROM parking_area WHERE parking_area_id = ?',
          [mapping.parkingAreaId]
        );

        if (areaCheck.length === 0) {
          console.log(`⚠️  Parking area with ID ${mapping.parkingAreaId} not found`);
          continue;
        }

        // Update parking area with layout path (not content)
        await db.query(
          'UPDATE parking_area SET layout_name = ?, layout_svg_path = ? WHERE parking_area_id = ?',
          [mapping.layoutName, mapping.svgFilePath, mapping.parkingAreaId]
        );

        console.log(`✅ Updated parking area "${areaCheck[0].parking_area_name}" (ID: ${mapping.parkingAreaId}) with AJAX layout: ${mapping.layoutName}`);

      } catch (error) {
        console.error(`❌ Error processing layout for parking area ${mapping.parkingAreaId}:`, error);
      }
    }

    console.log('🎉 AJAX parking layout setup completed!');

    // Verify the updates
    console.log('\n📋 Verification - Current parking areas with AJAX layouts:');
    const verification = await db.query(`
      SELECT 
        parking_area_id,
        parking_area_name,
        location,
        layout_name,
        layout_svg_path,
        CASE 
          WHEN layout_svg_path IS NOT NULL THEN 'AJAX Ready'
          ELSE 'No Layout'
        END as ajax_status
      FROM parking_area 
      ORDER BY parking_area_id
    `);

    console.table(verification);

  } catch (error) {
    console.error('❌ Error setting up AJAX parking layouts:', error);
  } finally {
    // Close database connection
    if (db.end) {
      db.end();
    }
  }
}

// Run the script
if (require.main === module) {
  setupAjaxParkingLayouts();
}

module.exports = { setupAjaxParkingLayouts };














