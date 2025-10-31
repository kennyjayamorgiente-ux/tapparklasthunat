const fs = require('fs');
const path = require('path');
const db = require('../config/database');

/**
 * Script to load parking layout SVGs into the database
 * Run this after adding the layout_svg column to parking_area table
 */

async function loadParkingLayouts() {
  try {
    console.log('🚀 Starting to load parking layout SVGs...');

    // Define the mapping of parking areas to their layout files
    const layoutMappings = [
      {
        parkingAreaId: 1, // Adjust these IDs based on your actual parking areas
        layoutName: 'FPAParking',
        svgFilePath: path.join(__dirname, '../../PARKINGLAYOUT-1,PARKINGLAYOUT-2/FPAParking.svg')
      },
      {
        parkingAreaId: 2, // Adjust these IDs based on your actual parking areas
        layoutName: 'FUMainParking', 
        svgFilePath: path.join(__dirname, '../../PARKINGLAYOUT-1,PARKINGLAYOUT-2/FUMainParking.svg')
      }
    ];

    for (const mapping of layoutMappings) {
      try {
        // Check if SVG file exists
        if (!fs.existsSync(mapping.svgFilePath)) {
          console.log(`⚠️  SVG file not found: ${mapping.svgFilePath}`);
          continue;
        }

        // Read SVG content
        const svgContent = fs.readFileSync(mapping.svgFilePath, 'utf8');
        
        // Check if parking area exists
        const areaCheck = await db.query(
          'SELECT parking_area_id, parking_area_name FROM parking_area WHERE parking_area_id = ?',
          [mapping.parkingAreaId]
        );

        if (areaCheck.length === 0) {
          console.log(`⚠️  Parking area with ID ${mapping.parkingAreaId} not found`);
          continue;
        }

        // Update parking area with layout data
        await db.query(
          'UPDATE parking_area SET layout_name = ?, layout_svg = ? WHERE parking_area_id = ?',
          [mapping.layoutName, svgContent, mapping.parkingAreaId]
        );

        console.log(`✅ Updated parking area "${areaCheck[0].parking_area_name}" (ID: ${mapping.parkingAreaId}) with layout: ${mapping.layoutName}`);

      } catch (error) {
        console.error(`❌ Error processing layout for parking area ${mapping.parkingAreaId}:`, error);
      }
    }

    console.log('🎉 Parking layout loading completed!');

    // Verify the updates
    console.log('\n📋 Verification - Current parking areas with layouts:');
    const verification = await db.query(`
      SELECT 
        parking_area_id,
        parking_area_name,
        location,
        layout_name,
        CASE 
          WHEN layout_svg IS NOT NULL THEN 'SVG Loaded'
          ELSE 'No SVG'
        END as svg_status
      FROM parking_area 
      ORDER BY parking_area_id
    `);

    console.table(verification);

  } catch (error) {
    console.error('❌ Error loading parking layouts:', error);
  } finally {
    // Close database connection
    if (db.end) {
      db.end();
    }
  }
}

// Run the script
if (require.main === module) {
  loadParkingLayouts();
}

module.exports = { loadParkingLayouts };














