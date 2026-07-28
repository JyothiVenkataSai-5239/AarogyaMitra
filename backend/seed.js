const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
require('dotenv').config();

const Hospital = require('./models/Hospital');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-appointment';

// Single-hospital mode: seed a single default hospital (Vijaya Hospital)
const hospitalData = [
  {
    name: 'Vijaya Hospital',
    city: 'Vijaya City',
    state: 'State',
    location: {
      lat: 0.0,
      lng: 0.0
    }
  }
];

const userData = [
  {
    name: 'Demo Admin',
    email: 'admin@hospital.com',
    password: 'admin123',
    role: 'admin'
  },
  {
    name: 'Demo Patient',
    email: 'patient@gmail.com',
    password: 'patient123',
    role: 'user'
  }
];

async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected');

    // Clear existing data
    await Hospital.deleteMany({});
    await User.deleteMany({});
    console.log('Cleared existing hospital and user data');

    // Insert new hospitals
    const insertedHospitals = await Hospital.insertMany(hospitalData);
    console.log(`Seeded ${insertedHospitals.length} hospitals`);

    // Insert demo users
    const insertedUsers = await User.insertMany(userData);
    console.log(`Seeded ${insertedUsers.length} demo users`);

    // Display seeded hospitals
    const allHospitals = await Hospital.find();
    console.log('\nSeeded Hospitals:');
    allHospitals.forEach(hospital => {
      console.log(`- ${hospital.name} (${hospital.city}, ${hospital.state})`);
    });

    console.log('\nSeeded Users:');
    console.log('- Admin: admin@hospital.com / admin123');
    console.log('- Patient: patient@gmail.com / patient123');

    await mongoose.connection.close();
    console.log('\nDatabase seeding completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
