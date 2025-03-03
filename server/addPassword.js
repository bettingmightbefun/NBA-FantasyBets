require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function addPassword() {
  try {
    // Find the user by username
    const username = 'Matthew'; // Change this to the username you want to update
    const user = await User.findOne({ username });
    
    if (!user) {
      console.error(`User ${username} not found`);
      process.exit(1);
    }
    
    console.log(`Found user: ${user.username} (${user._id})`);
    
    // Set a password
    user.password = 'password123'; // Change this to the password you want to set
    
    // Save the user
    await user.save();
    
    console.log(`Password set for user ${user.username}`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addPassword(); 