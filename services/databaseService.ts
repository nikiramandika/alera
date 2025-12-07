import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  addDoc,
  collectionGroup
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { User, MedicineReminder, Habit } from '@/types';

// USERS COLLECTION
export const userService = {
  // Create or update user document
  async createUser(userData: Partial<User>): Promise<void> {
    try {
      console.log('🔍 [DEBUG] UserService: Creating user for ID:', userData.userId);
      const userRef = doc(db, 'users', userData.userId!);
      console.log('🔍 [DEBUG] UserService: User document reference created');
      await setDoc(userRef, {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      console.log('🔍 [DEBUG] UserService: User document created successfully');
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Get user by ID
  async getUser(userId: string): Promise<User | null> {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data() as User;

        console.log('DEBUG: userData.createdAt:', userData.createdAt, 'type:', typeof userData.createdAt);
        console.log('DEBUG: userData.updatedAt:', userData.updatedAt, 'type:', typeof userData.updatedAt);

        // Handle different data types for dates
        const createdAt = userData.createdAt?.toDate?.() ||
                         (typeof userData.createdAt === 'string' ? new Date(userData.createdAt) : new Date());
        const updatedAt = userData.updatedAt?.toDate?.() ||
                         (typeof userData.updatedAt === 'string' ? new Date(userData.updatedAt) : new Date());

        return {
          ...userData,
          createdAt,
          updatedAt
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  },

  // Update user profile
  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    try {
      console.log('🔍 [DEBUG] UserService: Updating user', userId, 'with updates:', updates);
      const userRef = doc(db, 'users', userId);

      // Remove createdAt from updates to preserve original creation date
      const { createdAt, ...updatesWithoutCreatedAt } = updates;

      await updateDoc(userRef, {
        ...updatesWithoutCreatedAt,
        updatedAt: serverTimestamp()
      });
      console.log('🔍 [DEBUG] UserService: User updated successfully in database');
    } catch (error) {
      console.error('🔍 [DEBUG] UserService: Error updating user:', error);
      throw error;
    }
  }
};

// MEDICINES COLLECTION (subcollection under users)
export const medicineService = {
  // Add medicine reminder
  async addMedicine(userId: string, medicine: Omit<MedicineReminder, 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const medicinesRef = collection(db, 'users', userId, 'medicines');
      const docRef = await addDoc(medicinesRef, {
        ...medicine,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding medicine:', error);
      throw error;
    }
  },

  
  // Update medicine
  async updateMedicine(userId: string, medicineId: string, updates: Partial<MedicineReminder>): Promise<void> {
    try {
      const medicineRef = doc(db, 'users', userId, 'medicines', medicineId);
      await updateDoc(medicineRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating medicine:', error);
      throw error;
    }
  },

  // Delete medicine
  async deleteMedicine(userId: string, medicineId: string): Promise<void> {
    try {
      const medicineRef = doc(db, 'users', userId, 'medicines', medicineId);
      await deleteDoc(medicineRef);
    } catch (error) {
      console.error('Error deleting medicine:', error);
      throw error;
    }
  }
};

// HABITS COLLECTION (subcollection under users)
export const habitService = {
  // Add habit
  async addHabit(userId: string, habit: Omit<Habit, 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const habitsRef = collection(db, 'users', userId, 'habits');
      const docRef = await addDoc(habitsRef, {
        ...habit,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding habit:', error);
      throw error;
    }
  },

  
  // Update habit
  async updateHabit(userId: string, habitId: string, updates: Partial<Habit>): Promise<void> {
    try {
      const habitRef = doc(db, 'users', userId, 'habits', habitId);
      await updateDoc(habitRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating habit:', error);
      throw error;
    }
  },

  // Delete habit
  async deleteHabit(userId: string, habitId: string): Promise<void> {
    try {
      const habitRef = doc(db, 'users', userId, 'habits', habitId);
      await deleteDoc(habitRef);
    } catch (error) {
      console.error('Error deleting habit:', error);
      throw error;
    }
  }
};

// UTILITY FUNCTIONS
export const dbUtils = {
  // Convert Firebase Timestamp to Date
  timestampToDate(timestamp: any): Date {
    return timestamp?.toDate?.() || new Date();
  },

  // Convert Date to Firebase Timestamp
  dateToTimestamp(date: Date): Timestamp {
    return Timestamp.fromDate(date);
  },

  // Generate unique ID (Firebase already handles this with doc().id)
  generateId(): string {
    return doc(collection(db, 'temp')).id;
  }
};