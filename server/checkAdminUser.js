require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

// MongoDB connection string from .env file
const MONGODB_URI = 'mongodb+srv://matt:matt@cluster0.66xpj.mongodb.net/nba-fantasy-bets?retryWrites=true&w=majority&appName=Cluster0&authSource=admin';

async function checkAndUpdateAdminUser() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');
    
    // Check if user Matthew exists
    const user = await User.findOne({ username: 'Matthew' });
    
    if (user) {
      console.log('User found:', user.username);
      console.log('Admin status:', user.isAdmin ? 'Yes' : 'No');
      
      // If user exists but is not admin, make them admin
      if (!user.isAdmin) {
        console.log('Updating user to admin...');
        user.isAdmin = true;
        await user.save();
        console.log('User updated to admin successfully');
      }
    } else {
      console.log('User "Matthew" not found');
    }
    
    // List all users
    console.log('\nAll users in the system:');
    const users = await User.find({}).select('username isAdmin');
    users.forEach(u => {
      console.log(`- ${u.username} (Admin: ${u.isAdmin ? 'Yes' : 'No'})`);
    });
    
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAndUpdateAdminUser(); 