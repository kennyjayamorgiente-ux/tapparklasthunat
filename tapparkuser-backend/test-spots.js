const db = require('./config/database');

async function testSpots() {
  try {
    console.log('Testing spots for area 3...');
    
    const results = await db.query(`
      SELECT ps.*, psec.section_name 
      FROM parking_spot ps 
      JOIN parking_section psec ON ps.parking_section_id = psec.parking_section_id 
      WHERE psec.parking_area_id = 3 AND ps.status = 'active'
    `);
    
    console.log('Active spots in area 3:', results);
    
    // Also test the exact query from the API
    const apiResults = await db.query(`
      SELECT 
        ps.parking_spot_id as id,
        ps.spot_number,
        ps.status,
        ps.spot_type,
        psec.section_name
      FROM parking_spot ps
      JOIN parking_section psec ON ps.parking_section_id = psec.parking_section_id
      WHERE psec.parking_area_id = ? AND ps.status = 'active'
    `, [3]);
    
    console.log('API query results:', apiResults);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testSpots();
















