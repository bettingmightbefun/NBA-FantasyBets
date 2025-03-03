require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

console.log('Starting database connection test...');

// Test JWT functionality
try {
  console.log('Testing JWT functionality...');
  const testToken = jwt.sign({ id: '123456789012' }, process.env.JWT_SECRET, {
    expiresIn: '1h'
  });
  console.log('JWT test successful. Token generated:', testToken);
} catch (error) {
  console.error('JWT test failed:', error.message);
  process.exit(1);
}

// Test MongoDB connection
console.log('Testing MongoDB connection...');
console.log('MongoDB URI:', process.env.MONGODB_URI ? 'URI exists (not showing for security)' : 'URI is missing');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connection successful!');
    
    // Test creating a model
    const TestSchema = new mongoose.Schema({
      name: String
    });
    
    const Test = mongoose.model('Test', TestSchema);
    
    // Try to create a document
    return Test.create({ name: 'test' })
      .then(doc => {
        console.log('Document created successfully:', doc);
        // Clean up - delete the test document
        return Test.deleteOne({ _id: doc._id });
      })
      .then(() => {
        console.log('Test document deleted successfully');
        console.log('All tests passed!');
        process.exit(0);
      });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    console.error('Full error:', err);
    process.exit(1);
  }); 