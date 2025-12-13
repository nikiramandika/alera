import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, enableAuthPersistence } from '@/config/firebase';
import { User } from '@/types';
import { userService } from '@/services';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

let GoogleSignin: any = null;
let statusCodes: any = null;

// Try to import Google Sign-in with error handling for Expo Go compatibility
try {
  const googleSigninModule = require('@react-native-google-signin/google-signin');
  GoogleSignin = googleSigninModule.default;
  statusCodes = googleSigninModule.statusCodes;
  console.log('🔑 Google Sign-in module loaded successfully');
} catch (error) {
  console.warn('⚠️ Google Sign-in module not available (this is expected in Expo Go):', error);
  GoogleSignin = null;
  statusCodes = null;
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  isOffline: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  updateProfilePhoto: (photoURI: string) => Promise<{ success: boolean; error?: string }>;
}

// Helper function to check if user needs onboarding
const needsOnboarding = (user: User): boolean => {
  return !user.profile || !user.profile.gender || !user.profile.weight || !user.profile.age || !user.profile.birthDate;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthNavigation = () => {
  const { user, loading } = useAuth();

  // NOTE: Navigation is now handled in app/index.tsx to avoid race conditions
  // This hook is kept for backward compatibility but doesn't perform navigation

  return { user, loading, needsOnboarding: user ? needsOnboarding(user) : true };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingCache, setCheckingCache] = useState(true);
  const networkStatus = useNetworkStatus();
  const isOffline = networkStatus.isConnected === false;

  // Configure Google Sign-In
  useEffect(() => {
    if (GoogleSignin && typeof GoogleSignin.configure === 'function') {
      try {
        GoogleSignin.configure({
          webClientId: process.env.EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID,
          offlineAccess: false,
          iosClientId: process.env.EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID, // Use web client ID for iOS as fallback
          forceCodeForRefreshToken: true,
        });
        console.log('🔑 Google Sign-in configured successfully');
      } catch (error) {
        console.warn('⚠️ Failed to configure Google Sign-in:', error);
      }
    } else {
      console.log('🔑 Google Sign-in not available - skipping configuration');
    }
  }, []);

  // Create user document in Firestore
  const createUserDocument = async (firebaseUser: FirebaseUser, displayName?: string): Promise<User> => {
    console.log('🔍 [DEBUG] Creating user document for:', firebaseUser.uid);
    console.log('🔍 [DEBUG] displayName parameter received:', displayName);
    console.log('🔍 [DEBUG] firebaseUser.displayName:', firebaseUser.displayName);

    const finalDisplayName = displayName || firebaseUser.displayName || 'User';
    console.log('🔍 [DEBUG] Final displayName that will be saved:', finalDisplayName);

    const newUser: User = {
      userId: firebaseUser.uid,
      email: firebaseUser.email!,
      displayName: finalDisplayName,
      photoURL: firebaseUser.photoURL,
      phoneNumber: firebaseUser.phoneNumber,
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: {
        notifications: true,
        notificationSound: true,
        vibration: true,
        language: 'id',
        theme: 'light'
      }
    };

    console.log('🔍 [DEBUG] User object to be created:', newUser);

    // Use userService to create user
    try {
      console.log('🔍 [DEBUG] Calling userService.createUser');
      await userService.createUser(newUser);
      console.log('🔍 [DEBUG] User document created successfully');
      return newUser;
    } catch (error) {
      console.error('Error creating user document:', error);
      throw error;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // Enable Firebase Auth persistence first
        await enableAuthPersistence();

        // First, try to load cached user data
        const cachedUserData = await AsyncStorage.getItem('user_data');
        const cachedUser = cachedUserData ? JSON.parse(cachedUserData) : null;

        if (cachedUser && isMounted) {
          console.log('🔍 [DEBUG] Loaded user from cache:', cachedUser.displayName);
          setUser(cachedUser);
          setCheckingCache(false);

          // If offline, don't try to sync with Firebase immediately
          if (!isOffline) {
            console.log('🔍 [DEBUG] Online, will sync with Firebase');
          } else {
            console.log('🔍 [DEBUG] Offline, using cached data only');
            setLoading(false);
            return;
          }
        } else {
          setCheckingCache(false);
        }

        // Then listen for Firebase auth state changes
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          console.log('🔍 [DEBUG] Auth state changed, firebaseUser:', firebaseUser?.uid || 'No user');
          console.log('🔍 [DEBUG] Network status:', isOffline ? 'Offline' : 'Online');

          if (!isMounted) return;

          setFirebaseUser(firebaseUser);
          setCheckingCache(false);

          if (firebaseUser) {
            // Firebase user exists - user is authenticated
            console.log('🔍 [DEBUG] Firebase user authenticated:', firebaseUser.uid);

            // Prioritize cached user data for immediate response
            if (cachedUser && cachedUser.userId === firebaseUser.uid) {
              console.log('🔍 [DEBUG] Using cached user data immediately');
              setUser(cachedUser);
              // Update cached data to ensure freshness
              await AsyncStorage.setItem('user_data', JSON.stringify(cachedUser));
            }

            // Try to sync with database if online, but don't block user experience
            if (!isOffline) {
              try {
                console.log('🔍 [DEBUG] Online mode, syncing with database...');
                let userData = await userService.getUser(firebaseUser.uid);

                if (!userData) {
                  console.log('🔍 [DEBUG] User not found in database, creating new user document');
                  userData = await createUserDocument(firebaseUser);
                  console.log('🔍 [DEBUG] Created user data:', userData);
                } else {
                  console.log('🔍 [DEBUG] User found in database, syncing data');
                }

                // Update user state with fresh data from database
                setUser(userData);
                // Cache the updated data
                await AsyncStorage.setItem('user_data', JSON.stringify(userData));
              } catch (error) {
                console.error('🔍 [DEBUG] Error syncing with database:', error);
                // If we already have cached data set, keep it
                if (!cachedUser || cachedUser.userId !== firebaseUser.uid) {
                  console.log('🔍 [DEBUG] No valid cached data, creating basic user from Firebase');
                  // Create minimal user data from Firebase user as fallback
                  const fallbackUser: User = {
                    userId: firebaseUser.uid,
                    email: firebaseUser.email!,
                    displayName: firebaseUser.displayName || 'User',
                    photoURL: firebaseUser.photoURL,
                    phoneNumber: firebaseUser.phoneNumber,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    settings: {
                      notifications: true,
                      notificationSound: true,
                      vibration: true,
                      language: 'id',
                      theme: 'light'
                    }
                  };
                  setUser(fallbackUser);
                  await AsyncStorage.setItem('user_data', JSON.stringify(fallbackUser));
                }
              }
            } else {
              // Offline mode - ensure we have user data set
              if (!cachedUser || cachedUser.userId !== firebaseUser.uid) {
                console.log('🔍 [DEBUG] Offline mode with no valid cache, creating basic user');
                // Create minimal user data for offline mode
                const offlineUser: User = {
                  userId: firebaseUser.uid,
                  email: firebaseUser.email!,
                  displayName: firebaseUser.displayName || 'User',
                  photoURL: firebaseUser.photoURL,
                  phoneNumber: firebaseUser.phoneNumber,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  settings: {
                    notifications: true,
                    notificationSound: true,
                    vibration: true,
                    language: 'id',
                    theme: 'light'
                  }
                };
                setUser(offlineUser);
                await AsyncStorage.setItem('user_data', JSON.stringify(offlineUser));
              }
            }
          } else {
            console.log('🔍 [DEBUG] User signed out');
            setUser(null);
            // Clear cached data
            await AsyncStorage.removeItem('user_data');
          }

          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('🔍 [DEBUG] Error initializing auth:', error);
        if (isMounted) {
          setCheckingCache(false);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [isOffline]);

  // Sign in with email and password
  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error: any) {
      let errorMessage = 'An error occurred during sign in';

      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later';
          break;
        default:
          errorMessage = error.message;
      }

      return { success: false, error: errorMessage };
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, displayName: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔍 [DEBUG] signUp function called with:', { email, displayName });
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('🔍 [DEBUG] Firebase user created successfully:', userCredential.user.uid);
      console.log('🔍 [DEBUG] Firebase user.displayName:', userCredential.user.displayName);

      // Create user document with display name
      await createUserDocument(userCredential.user, displayName);
      console.log('🔍 [DEBUG] User document created successfully');

      return { success: true };
    } catch (error: any) {
      let errorMessage = 'An error occurred during sign up';

      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'An account with this email already exists';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password accounts are not enabled';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password should be at least 6 characters';
          break;
        default:
          errorMessage = error.message;
      }

      return { success: false, error: errorMessage };
    }
  };

  // Sign in with Google
  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔍 [GOOGLE] Starting Google Sign-In process...');

      // Check if Google Sign-in is available
      if (!GoogleSignin) {
        console.warn('⚠️ Google Sign-in is not available (please use development build)');
        return { success: false, error: 'Google Sign-in is not available in Expo Go. Please use a development build for full functionality.' };
      }

      // Check if your device supports Google Play Services
      if (GoogleSignin.hasPlayServices) {
        await GoogleSignin.hasPlayServices({
          showPlayServicesUpdateDialog: true,
        });
        console.log('🔍 [GOOGLE] Play Services available');
      }

      // Sign in with Google
      const userInfo = await GoogleSignin.signIn();
      console.log('🔍 [GOOGLE] Google Sign-In successful');
      console.log('🔍 [GOOGLE] User info:', {
        email: userInfo.data?.user.email,
        name: userInfo.data?.user.name,
        idToken: userInfo.data?.idToken ? 'present' : 'missing'
      });

      // Create a Google credential with the token
      const googleCredential = GoogleAuthProvider.credential(userInfo.data?.idToken);
      console.log('🔍 [GOOGLE] Google credential created');

      // Sign-in with the credential from Google
      const result = await signInWithCredential(auth, googleCredential);
      console.log('🔍 [GOOGLE] Firebase sign-in successful');
      console.log('🔍 [GOOGLE] User signed in:', result.user.uid);

      // Force a brief delay to ensure user state is properly set
      await new Promise(resolve => setTimeout(resolve, 1000));

      return { success: true };
    } catch (error: any) {
      console.log('🔍 [GOOGLE] Error occurred:', error);
      console.log('🔍 [GOOGLE] Error code:', error.code);
      console.log('🔍 [GOOGLE] Error message:', error.message);

      let errorMessage = 'An error occurred during Google sign in';

      if (statusCodes && error.code === statusCodes.SIGN_IN_CANCELLED) {
        errorMessage = 'Sign-in was cancelled';
      } else if (statusCodes && error.code === statusCodes.IN_PROGRESS) {
        errorMessage = 'Sign-in is already in progress';
      } else if (statusCodes && error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        errorMessage = 'Google Play Services is not available';
      } else if (error.message?.includes('RNGoogleSignin')) {
        errorMessage = 'Google Sign-in is not available in Expo Go. Please use a development build for full functionality.';
      } else {
        // Handle Firebase auth errors
        switch (error.code) {
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your internet connection.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many sign-in attempts. Please try again later.';
            break;
          case 'auth/user-disabled':
            errorMessage = 'This account has been disabled.';
            break;
          case 'auth/invalid-credential':
            errorMessage = 'Invalid Google credentials. Please try again.';
            break;
          case 'auth/email-already-in-use':
            errorMessage = 'This email is already registered. Please sign in with your password instead.';
            break;
          case 'auth/account-exists-with-different-credential':
            // This happens when user tries to sign in with Google but email is already registered with email/password
            console.log('🔍 [GOOGLE] Account exists with different credential');
            errorMessage = 'This email is already registered with password. Please use password sign-in or link your Google account in settings.';
            break;
          default:
            errorMessage = error.message || 'Failed to sign in with Google';
        }
      }

      return { success: false, error: errorMessage };
    }
  };

  // Sign out
  const signOut = async (): Promise<void> => {
    try {
      // Sign out from Google as well
      try {
        if (GoogleSignin && typeof GoogleSignin.signOut === 'function') {
          await GoogleSignin.signOut();
        }
      } catch (error) {
        console.log('Google Sign-in was not active, continuing...');
      }

      await firebaseSignOut(auth);
      // Clear cached data
      await AsyncStorage.removeItem('user_data');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Update user profile
  const updateUserProfile = async (data: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    console.log('🔍 [DEBUG] Updating user profile with data:', data);
    if (!user) return { success: false, error: 'No user logged in' };

    try {
      console.log('🔍 [DEBUG] Calling userService.updateUser');
      // Use userService to update user
      await userService.updateUser(user.userId, data);
      console.log('🔍 [DEBUG] Profile updated successfully in database');

      // Update local state - preserve original createdAt
      const updatedUser = {
        ...user,
        ...data,
        updatedAt: new Date(),
        createdAt: user.createdAt // Preserve original creation date
      };
      console.log('🔍 [DEBUG] Updated local user state:', updatedUser);
      setUser(updatedUser);

      // Update cached data
      await AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));

      return { success: true };
    } catch (error: any) {
      console.error('🔍 [DEBUG] Error updating profile:', error);
      return { success: false, error: error.message };
    }
  };

  // Update profile photo
  const updateProfilePhoto = async (photoURI: string): Promise<{ success: boolean; error?: string }> => {
    console.log('🔍 [DEBUG] Updating profile photo with URI:', photoURI);
    if (!user) return { success: false, error: 'No user logged in' };

    try {
      console.log('🔍 [DEBUG] Calling userService.updateUser with photoURL');
      // Update user with photo URL
      await userService.updateUser(user.userId, { photoURL: photoURI });
      console.log('🔍 [DEBUG] Profile photo updated successfully in database');

      // Update local state - preserve original createdAt
      const updatedUser = {
        ...user,
        photoURL: photoURI,
        updatedAt: new Date(),
        createdAt: user.createdAt // Preserve original creation date
      };
      console.log('🔍 [DEBUG] Updated local user state with photo:', updatedUser);
      setUser(updatedUser);

      // Update cached data
      await AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));

      return { success: true };
    } catch (error: any) {
      console.error('🔍 [DEBUG] Error updating profile photo:', error);
      return { success: false, error: error.message };
    }
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    isOffline,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    updateUserProfile,
    updateProfilePhoto
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};