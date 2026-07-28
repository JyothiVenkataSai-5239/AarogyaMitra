require('dotenv').config();
const mongoose = require('mongoose');
const Hospital = require('./models/Hospital');

async function showHospitals() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-healthcare');
    const hospitals = await Hospital.find().select('name city state').lean();
    console.log('\nHospitals in Database:');
    console.log('======================');
    hospitals.forEach((h, i) => {
      console.log((i + 1) + '. ' + h.name + ' (' + h.city + ', ' + h.state + ')');
    });
    console.log('\nTotal Hospitals: ' + hospitals.length);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

showHospitals();
