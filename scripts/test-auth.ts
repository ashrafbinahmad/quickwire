// Test script to verify authentication system
import { hashPassword, verifyPassword, generateToken, verifyToken } from '@/lib/auth';

async function testAuthSystem() {
  console.log('Testing authentication system...\n');

  // Test password hashing
  console.log('1. Testing password hashing...');
  const password = 'testpassword123';
  const hashedPassword = await hashPassword(password);
  console.log('   Password hashed successfully');
  
  // Test password verification
  const isValid = await verifyPassword(password, hashedPassword);
  console.log('   Password verification:', isValid ? 'PASS' : 'FAIL');
  
  const isInvalid = await verifyPassword('wrongpassword', hashedPassword);
  console.log('   Wrong password test:', !isInvalid ? 'PASS' : 'FAIL');
  
  // Test JWT token generation
  console.log('\n2. Testing JWT token generation...');
  const payload = {
    userId: 'user123',
    email: 'test@example.com',
    role: 'USER' as const
  };
  
  const token = generateToken(payload);
  console.log('   Token generated successfully');
  console.log('   Token length:', token.length);
  
  // Test JWT token verification
  try {
    const verifiedPayload = verifyToken(token);
    console.log('   Token verification:', 
      verifiedPayload.userId === payload.userId && 
      verifiedPayload.email === payload.email &&
      verifiedPayload.role === payload.role ? 'PASS' : 'FAIL');
  } catch (error) {
    console.log('   Token verification: FAIL -', error);
  }
  
  // Test invalid token
  try {
    verifyToken('invalid.token.here');
    console.log('   Invalid token test: FAIL (should have thrown)');
  } catch (error) {
    console.log('   Invalid token test: PASS');
  }
  
  console.log('\nAuthentication system tests completed!');
}

// Run the test
testAuthSystem().catch(console.error);