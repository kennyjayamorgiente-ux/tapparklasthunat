const db = require('../config/database');
const bcrypt = require('bcryptjs');

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Check if users table has existing data
    const existingUsers = await db.query('SELECT COUNT(*) as count FROM users');
    if (existingUsers[0].count > 0) {
      console.log(`⚠️  Users table already has ${existingUsers[0].count} records.`);
      console.log('💡 Seeding will only add new records (using INSERT IGNORE)');
    }

    // Create sample users
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const users = [
      {
        email: 'admin@tapparkuser.com',
        password: hashedPassword,
        first_name: 'Admin',
        last_name: 'User',
        phone: '+1234567890',
        balance: 1000.00,
        is_verified: true
      },
      {
        email: 'john.doe@example.com',
        password: hashedPassword,
        first_name: 'John',
        last_name: 'Doe',
        phone: '+1234567891',
        balance: 500.00,
        is_verified: true
      },
      {
        email: 'jane.smith@example.com',
        password: hashedPassword,
        first_name: 'Jane',
        last_name: 'Smith',
        phone: '+1234567892',
        balance: 750.00,
        is_verified: true
      }
    ];

    for (const user of users) {
      await db.query(`
        INSERT IGNORE INTO users (email, password, first_name, last_name, phone, balance, is_verified)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [user.email, user.password, user.first_name, user.last_name, user.phone, user.balance, user.is_verified]);
    }

    // Get user IDs for foreign key relationships
    const userIds = await db.query('SELECT id, email FROM users');
    const userMap = {};
    userIds.forEach(user => {
      userMap[user.email] = user.id;
    });

    // Create sample vehicles
    const vehicles = [
      {
        user_id: userMap['john.doe@example.com'],
        plate_number: 'ABC-1234',
        vehicle_type: 'car',
        brand: 'Toyota',
        model: 'Camry',
        color: 'Silver',
        is_default: true
      },
      {
        user_id: userMap['john.doe@example.com'],
        plate_number: 'XYZ-5678',
        vehicle_type: 'motorcycle',
        brand: 'Honda',
        model: 'CBR',
        color: 'Red',
        is_default: false
      },
      {
        user_id: userMap['jane.smith@example.com'],
        plate_number: 'DEF-9012',
        vehicle_type: 'car',
        brand: 'Honda',
        model: 'Civic',
        color: 'Blue',
        is_default: true
      }
    ];

    for (const vehicle of vehicles) {
      await db.query(`
        INSERT IGNORE INTO vehicles (user_id, plate_number, vehicle_type, brand, model, color, is_default)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [vehicle.user_id, vehicle.plate_number, vehicle.vehicle_type, vehicle.brand, vehicle.model, vehicle.color, vehicle.is_default]);
    }

    // Create sample parking locations
    const parkingLocations = [
      {
        name: 'Downtown Mall Parking',
        address: '123 Main Street, Downtown, City',
        latitude: 40.7128,
        longitude: -74.0060,
        total_spots: 100,
        available_spots: 85,
        hourly_rate: 2.50,
        daily_rate: 20.00,
        operating_hours: JSON.stringify({
          monday: { open: '06:00', close: '22:00' },
          tuesday: { open: '06:00', close: '22:00' },
          wednesday: { open: '06:00', close: '22:00' },
          thursday: { open: '06:00', close: '22:00' },
          friday: { open: '06:00', close: '23:00' },
          saturday: { open: '08:00', close: '23:00' },
          sunday: { open: '08:00', close: '20:00' }
        }),
        amenities: JSON.stringify(['security', 'cctv', 'lighting', 'disabled_access'])
      },
      {
        name: 'University Campus Parking',
        address: '456 University Ave, Campus District',
        latitude: 40.7589,
        longitude: -73.9851,
        total_spots: 200,
        available_spots: 150,
        hourly_rate: 1.50,
        daily_rate: 12.00,
        operating_hours: JSON.stringify({
          monday: { open: '05:00', close: '23:00' },
          tuesday: { open: '05:00', close: '23:00' },
          wednesday: { open: '05:00', close: '23:00' },
          thursday: { open: '05:00', close: '23:00' },
          friday: { open: '05:00', close: '23:00' },
          saturday: { open: '07:00', close: '22:00' },
          sunday: { open: '07:00', close: '22:00' }
        }),
        amenities: JSON.stringify(['security', 'cctv', 'lighting', 'student_discount'])
      },
      {
        name: 'Airport Terminal Parking',
        address: '789 Airport Blvd, Airport District',
        latitude: 40.6892,
        longitude: -74.1745,
        total_spots: 500,
        available_spots: 320,
        hourly_rate: 4.00,
        daily_rate: 35.00,
        operating_hours: JSON.stringify({
          monday: { open: '00:00', close: '23:59' },
          tuesday: { open: '00:00', close: '23:59' },
          wednesday: { open: '00:00', close: '23:59' },
          thursday: { open: '00:00', close: '23:59' },
          friday: { open: '00:00', close: '23:59' },
          saturday: { open: '00:00', close: '23:59' },
          sunday: { open: '00:00', close: '23:59' }
        }),
        amenities: JSON.stringify(['24/7', 'security', 'cctv', 'shuttle_service', 'valet'])
      }
    ];

    for (const location of parkingLocations) {
      await db.query(`
        INSERT IGNORE INTO parking_locations 
        (name, address, latitude, longitude, total_spots, available_spots, hourly_rate, daily_rate, operating_hours, amenities)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        location.name, location.address, location.latitude, location.longitude,
        location.total_spots, location.available_spots, location.hourly_rate,
        location.daily_rate, location.operating_hours, location.amenities
      ]);
    }

    // Create sample notifications
    const notifications = [
      {
        user_id: userMap['john.doe@example.com'],
        title: 'Welcome to Tapparkuser!',
        message: 'Thank you for joining our parking management platform. Start by adding your vehicle and finding nearby parking spots.',
        type: 'info'
      },
      {
        user_id: userMap['jane.smith@example.com'],
        title: 'Parking Session Completed',
        message: 'Your parking session at Downtown Mall has been completed. Total cost: $15.00',
        type: 'success'
      }
    ];

    for (const notification of notifications) {
      await db.query(`
        INSERT IGNORE INTO notifications (user_id, title, message, type)
        VALUES (?, ?, ?, ?)
      `, [notification.user_id, notification.title, notification.message, notification.type]);
    }

    console.log('✅ Database seeding completed successfully!');
    console.log('📊 Seeded data:');
    console.log('   - 3 users (including admin)');
    console.log('   - 3 vehicles');
    console.log('   - 3 parking locations');
    console.log('   - 2 notifications');
    console.log('');
    console.log('🔑 Test credentials:');
    console.log('   Email: john.doe@example.com | Password: password123');
    console.log('   Email: jane.smith@example.com | Password: password123');
    console.log('   Email: admin@tapparkuser.com | Password: password123');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
};

// Run seeding if called directly
if (require.main === module) {
  seedData()
    .then(() => {
      console.log('🎉 Seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedData };
