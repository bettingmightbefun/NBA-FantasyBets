require('dotenv').config();
const jwt = require('jsonwebtoken');

console.log('Starting JWT test...');

// Check if JWT_SECRET is defined
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not defined in environment variables');
  process.exit(1);
}

console.log('JWT_SECRET is defined');

// Test JWT functionality
try {
  const testId = '123456789012';
  console.log('Testing JWT token generation for ID:', testId);
  
  const token = jwt.sign({ id: testId }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
  
  console.log('Token generated successfully:', token);
  
  // Verify the token
  console.log('Verifying token...');
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
  console.log('Token verified successfully. Decoded payload:', decoded);
  console.log('JWT test passed!');
} catch (error) {
  console.error('JWT test failed:', error);
  process.exit(1);
} 