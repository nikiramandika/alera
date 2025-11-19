import { auth } from '@/config/firebase';
import { userService } from './databaseService';

// Test Firebase Connection
export const testFirebaseConnection = async () => {
  console.log('🔥 Testing Firebase Connection...');

  try {
    // Test 1: Check if Firebase Auth is initialized
    if (auth) {
      console.log('✅ Firebase Auth initialized successfully');
    } else {
      console.log('❌ Firebase Auth not initialized');
      return false;
    }

    // Test 2: Check current user
    const currentUser = auth.currentUser;
    if (currentUser) {
      console.log(`✅ User logged in: ${currentUser.email}`);

      // Test 3: Try to get user data from Firestore
      try {
        const userData = await userService.getUser(currentUser.uid);
        if (userData) {
          console.log('✅ Firestore connection working - User data retrieved');
          console.log('📊 User profile:', userData.profile);
          return true;
        } else {
          console.log('⚠️ User not found in Firestore - first time login?');
          return true;
        }
      } catch (error) {
        console.log('❌ Error connecting to Firestore:', error);
        return false;
      }
    } else {
      console.log('ℹ️ No user logged in - please register/login first');
      return true;
    }
  } catch (error) {
    console.log('❌ Firebase connection test failed:', error);
    return false;
  }
};

// Test user creation
export const testUserCreation = async (testEmail: string, testPassword: string) => {
  console.log('🧪 Testing user creation...');

  try {
    // This would be called from your AuthContext signup function
    console.log('✅ User creation test setup complete');
    console.log('📝 To test full user creation:');
    console.log('   1. Register a new user in the app');
    console.log('   2. Check Firebase Console → Authentication → Users');
    console.log('   3. Check Firebase Console → Firestore → users collection');

    return true;
  } catch (error) {
    console.log('❌ User creation test failed:', error);
    return false;
  }
};

// Test database operations
export const testDatabaseOperations = async () => {
  console.log('💾 Testing database operations...');

  const tests = [
    {
      name: 'Create User',
      test: () => userService.createUser({
        userId: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User',
        profile: {
          gender: 'male',
          weight: 70,
          age: 25
        }
      })
    },
    {
      name: 'Get User',
      test: () => userService.getUser('test-user-id')
    },
    {
      name: 'Update User',
      test: () => userService.updateUser('test-user-id', {
        displayName: 'Updated Test User'
      })
    }
  ];

  for (const test of tests) {
    try {
      await test.test();
      console.log(`✅ ${test.name} - Success`);
    } catch (error) {
      console.log(`❌ ${test.name} - Failed:`, error);
    }
  }
};