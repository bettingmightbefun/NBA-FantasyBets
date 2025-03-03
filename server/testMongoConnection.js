require('dotenv').config();
const mongoose = require('mongoose');

console.log('Starting MongoDB connection test...');

// Check if MONGODB_URI is defined
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

console.log('MONGODB_URI is defined');
console.log('Attempting to connect to MongoDB...');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connection successful!');
    
    // List all collections in the database
    return mongoose.connection.db.listCollections().toArray();
  })
  .then(collections => {
    console.log('Collections in database:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
    // Create a test model
    const TestSchema = new mongoose.Schema({
      name: String,
      testDate: { type: Date, default: Date.now }
    });
    
    const Test = mongoose.model('TestConnection', TestSchema);
    
    // Try to create a document
    console.log('Attempting to create a test document...');
    return Test.create({ name: 'connection_test' });
  })
  .then(doc => {
    console.log('✅ Test document created successfully:', doc);
    
    // Clean up - delete the test document
    return mongoose.model('TestConnection').deleteOne({ _id: doc._id });
  })
  .then(() => {
    console.log('✅ Test document deleted successfully');
    console.log('✅ All MongoDB tests passed!');
    
    // Close the connection
    return mongoose.connection.close();
  })
  .then(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ MongoDB test failed:', err.message);
    console.error('Full error:', err);
    
    // Try to close the connection if it exists
    if (mongoose.connection) {
      mongoose.connection.close()
        .then(() => {
          console.log('MongoDB connection closed after error');
          process.exit(1);
        })
        .catch(() => process.exit(1));
    } else {
      process.exit(1);
    }
  }); 