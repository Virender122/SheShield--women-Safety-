require('dotenv').config();
const mongoose = require('mongoose');
const Guardian = require('./models/Guardian');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://latheeshvalmeti226_db_user:sdFMMx0a7OHUm6h4@cluster0.bjlamfh.mongodb.net/women-safety?retryWrites=true&w=majority&appName=Cluster0')
  .then(async () => {
    console.log("Connected to MongoDB");
    const guardians = await Guardian.find();
    console.log("Guardians in DB:", guardians);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
