import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { useRouter } from 'expo-router';
import { auth } from '@/config/firebase';
import { User } from '@/types';
import { userService } from '@/services';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
}

// Helper function to check if user needs onboarding
const needsOnboarding = (user: User): boolean => {
  return !user.profile || !user.profile.gender || !user.profile.weight || !user.profile.age;
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
  const router = useRouter();

  useEffect(() => {
    console.log('🔍 [DEBUG] AuthNavigation - user:', user?.userId || 'No user', 'loading:', loading);
    if (!loading) {
      if (user) {
        const needsOnboardingResult = needsOnboarding(user);
        console.log('🔍 [DEBUG] AuthNavigation - needsOnboarding:', needsOnboardingResult);
        console.log('🔍 [DEBUG] AuthNavigation - user.profile:', user.profile);
        if (needsOnboardingResult) {
          console.log('🔍 [DEBUG] AuthNavigation - Navigating to onboarding');
          router.replace('/(auth)/onboarding');
        } else {
          console.log('🔍 [DEBUG] AuthNavigation - User complete, no navigation needed');
        }
      }
    }
  }, [user, loading, router]);

  return { user, loading, needsOnboarding: user ? needsOnboarding(user) : true };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

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

  // Check if user needs onboarding
  const needsOnboarding = (user: User): boolean => {
    return !user.profile || !user.profile.gender || !user.profile.weight || !user.profile.age;
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔍 [DEBUG] Auth state changed, firebaseUser:', firebaseUser?.uid || 'No user');
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        try {
          console.log('🔍 [DEBUG] Checking if user exists in database...');
          // Check if user exists first
          let userData = await userService.getUser(firebaseUser.uid);

          if (!userData) {
            console.log('🔍 [DEBUG] User not found, creating new user document');
            userData = await createUserDocument(firebaseUser);
            console.log('🔍 [DEBUG] Created user data:', userData);
          } else {
            console.log('🔍 [DEBUG] User found in database:', userData);
          }

          console.log('🔍 [DEBUG] Setting user state with displayName:', userData.displayName);
          setUser(userData);
        } catch (error) {
          console.error('🔍 [DEBUG] Error fetching user data:', error);
        }
      } else {
        console.log('🔍 [DEBUG] User signed out');
        setUser(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

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
      // Note: For web, you'd use different Google Sign-In implementation
      // This is a placeholder for Google Sign-In
      const provider = new GoogleAuthProvider();
      await signInWithCredential(auth, provider as any);
      return { success: true };
    } catch (error: any) {
      let errorMessage = 'An error occurred during Google sign in';

      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'Sign-in popup was closed before completion';
          break;
        case 'auth/popup-blocked':
          errorMessage = 'Sign-in popup was blocked by the browser';
          break;
        default:
          errorMessage = error.message;
      }

      return { success: false, error: errorMessage };
    }
  };

  // Sign out
  const signOut = async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
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

      // Update local state
      const updatedUser = { ...user, ...data, updatedAt: new Date() };
      console.log('🔍 [DEBUG] Updated local user state:', updatedUser);
      setUser(updatedUser);

      return { success: true };
    } catch (error: any) {
      console.error('🔍 [DEBUG] Error updating profile:', error);
      return { success: false, error: error.message };
    }
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};