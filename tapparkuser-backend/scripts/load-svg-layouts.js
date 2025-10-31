const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '122904',
  database: 'tappark'
};

async function loadSvgLayouts() {
  let connection;
  
  try {
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database');

    // Read SVG files
    const fpaSvgPath = path.join(__dirname, '../../PARKINGLAYOUT-1,PARKINGLAYOUT-2/FPAParking.svg');
    const fuMainSvgPath = path.join(__dirname, '../../PARKINGLAYOUT-1,PARKINGLAYOUT-2/FUMainParking.svg');
    
    const fpaSvgContent = fs.readFileSync(fpaSvgPath, 'utf8');
    const fuMainSvgContent = fs.readFileSync(fuMainSvgPath, 'utf8');

    console.log('Read SVG files successfully');

    // Update parking areas with SVG content
    const queries = [
      {
        sql: `UPDATE parking_area SET layout_name = 'FPAParking', layout_svg = ? WHERE parking_area_id = 1`,
        values: [fpaSvgContent]
      },
      {
        sql: `UPDATE parking_area SET layout_name = 'FUMainParking', layout_svg = ? WHERE parking_area_id = 2`,
        values: [fuMainSvgContent]
      }
    ];

    for (const query of queries) {
      await connection.execute(query.sql, query.values);
      console.log(`Updated parking area with layout: ${query.values[0].substring(0, 50)}...`);
    }

    console.log('✅ Successfully loaded SVG layouts into database!');
    
  } catch (error) {
    console.error('❌ Error loading SVG layouts:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the script
loadSvgLayouts();
