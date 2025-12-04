import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { MedicineReminder, MedicineHistory } from '@/types';

// MEDICINES COLLECTION (subcollection under users)
export const medicineService = {
  // Helper method to normalize date to start of day (00:00:00)
  normalizeDateToStart(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  },

  // Helper method to normalize date to end of day (23:59:59)
  normalizeDateToEnd(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(23, 59, 59, 999);
    return normalized;
  },
  // Add new medicine
  async addMedicine(userId: string, medicine: Omit<MedicineReminder, 'reminderId' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const medicinesRef = collection(db, 'users', userId, 'medicines');
      const docRef = await addDoc(medicinesRef, {
        ...medicine,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding medicine:', error);
      throw error;
    }
  },

  // Get all active medicines
  async getMedicines(userId: string): Promise<MedicineReminder[]> {
    try {
      console.log('🔍 [DEBUG] Fetching medicines for userId:', userId);
      const medicinesRef = collection(db, 'users', userId, 'medicines');
      const q = query(medicinesRef, where('isActive', '==', true));
      console.log('🔍 [DEBUG] Query created, executing...');
      const querySnapshot = await getDocs(q);
      console.log('🔍 [DEBUG] Query executed, docs found:', querySnapshot.docs.length);

      const today = new Date();
      today.setHours(23, 59, 59, 999);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          reminderId: doc.id,
          duration: {
            ...data.duration,
            startDate: this.normalizeDateToStart(data.duration?.startDate?.toDate?.() || new Date()),
            endDate: data.duration?.endDate?.toDate?.() ? this.normalizeDateToEnd(data.duration.endDate.toDate()) : null,
          },
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date()
        };
      })
      .filter((medicine: any) => {
        // Include only active medicines (don't filter by expiry date)
        if (!medicine.isActive) return false;

        // Don't filter by expiry date - let expired medicines still appear
        return true;
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) as MedicineReminder[];
    } catch (error) {
      console.error('Error getting medicines:', error);
      throw error;
    }
  },

  // Get medicine by ID
  async getMedicineById(userId: string, medicineId: string): Promise<MedicineReminder | null> {
    try {
      const medicineRef = doc(db, 'users', userId, 'medicines', medicineId);
      const medicineDoc = await getDoc(medicineRef);

      if (medicineDoc.exists()) {
        const data = medicineDoc.data();
        return {
          ...data,
          reminderId: medicineDoc.id,
          duration: {
            ...data.duration,
            startDate: this.normalizeDateToStart(data.duration?.startDate?.toDate?.() || new Date()),
            endDate: data.duration?.endDate?.toDate?.() ? this.normalizeDateToEnd(data.duration.endDate.toDate()) : null,
          },
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date()
        } as MedicineReminder;
      }
      return null;
    } catch (error) {
      console.error('Error getting medicine:', error);
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

  // Delete medicine (soft delete)
  async deleteMedicine(userId: string, medicineId: string): Promise<void> {
    try {
      const medicineRef = doc(db, 'users', userId, 'medicines', medicineId);
      await updateDoc(medicineRef, {
        isActive: false,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error deleting medicine:', error);
      throw error;
    }
  },

  // Get medicines for today
  async getTodayMedicines(userId: string): Promise<MedicineReminder[]> {
    try {
      const medicines = await this.getMedicines(userId);
      const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.

      return medicines.filter(medicine => {
        // Check if medicine should be taken today
        if (medicine.frequency.type === 'daily') return true;
        if (medicine.frequency.type === 'interval') {
          return medicine.frequency.specificDays?.includes(today);
        }
        return false;
      });
    } catch (error) {
      console.error('Error getting today medicines:', error);
      throw error;
    }
  },

  };

// MEDICINE HISTORY COLLECTION (subcollection under medicines)
export const medicineHistoryService = {
  // Add medicine intake record
  async addMedicineHistory(userId: string, medicineId: string, history: Omit<MedicineHistory, 'historyId' | 'createdAt' | 'reminderId' | 'userId' | 'medicineName'>): Promise<string> {
    try {
      // Get medicine details to include name and reminderId
      const medicineDoc = await getDoc(doc(db, 'users', userId, 'medicines', medicineId));
      if (!medicineDoc.exists()) {
        throw new Error('Medicine not found');
      }

      const medicineData = medicineDoc.data();
      const historyRef = collection(db, 'users', userId, 'medicines', medicineId, 'history');
      const docRef = await addDoc(historyRef, {
        ...history,
        userId,
        reminderId: medicineId,
        medicineName: medicineData.medicineName || 'Unknown Medicine',
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding medicine history:', error);
      throw error;
    }
  },

  // Get medicine history
  async getMedicineHistory(userId: string, medicineId: string): Promise<MedicineHistory[]> {
    try {
      const historyRef = collection(db, 'users', userId, 'medicines', medicineId, 'history');
      const q = query(historyRef, where('scheduledTime', '>=',
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
      ));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        historyId: doc.id,
        scheduledTime: doc.data().scheduledTime?.toDate?.() || new Date(),
        actualTime: doc.data().actualTime?.toDate?.(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      })).sort((a, b) => b.scheduledTime.getTime() - a.scheduledTime.getTime()) as MedicineHistory[];
    } catch (error) {
      console.error('Error getting medicine history:', error);
      throw error;
    }
  },

  // Get today's medicine history
  async getTodayMedicineHistory(userId: string): Promise<MedicineHistory[]> {
    try {
      const medicines = await medicineService.getMedicines(userId);
      const allHistory: MedicineHistory[] = [];

      for (const medicine of medicines) {
        const history = await this.getMedicineHistory(userId, medicine.reminderId);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayHistory = history.filter(h =>
          h.scheduledTime >= today && h.scheduledTime < tomorrow
        );
        allHistory.push(...todayHistory);
      }

      return allHistory.sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
    } catch (error) {
      console.error('Error getting today medicine history:', error);
      throw error;
    }
  },

  // Mark medicine as taken
  async markMedicineTaken(userId: string, medicineId: string, scheduledTime: Date): Promise<void> {
    try {
      await this.addMedicineHistory(userId, medicineId, {
        medicineId,
        scheduledTime,
        actualTime: new Date(),
        status: 'taken'
      });
    } catch (error) {
      console.error('Error marking medicine as taken:', error);
      throw error;
    }
  },

  // Mark medicine as missed
  async markMedicineMissed(userId: string, medicineId: string, scheduledTime: Date): Promise<void> {
    try {
      await this.addMedicineHistory(userId, medicineId, {
        medicineId,
        scheduledTime,
        status: 'missed'
      });
    } catch (error) {
      console.error('Error marking medicine as missed:', error);
      throw error;
    }
  },

  // Get adherence statistics
  async getAdherenceStats(userId: string, days = 30): Promise<{
    total: number;
    taken: number;
    missed: number;
    percentage: number;
  }> {
    try {
      const medicines = await medicineService.getMedicines(userId);
      let total = 0, taken = 0, missed = 0;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      for (const medicine of medicines) {
        const history = await this.getMedicineHistory(userId, medicine.reminderId);
        const filteredHistory = history.filter(h => h.scheduledTime >= startDate);

        total += filteredHistory.length;
        taken += filteredHistory.filter(h => h.status === 'taken').length;
        missed += filteredHistory.filter(h => h.status === 'missed').length;
      }

      return {
        total,
        taken,
        missed,
        percentage: total > 0 ? Math.round((taken / total) * 100) : 0
      };
    } catch (error) {
      console.error('Error getting adherence stats:', error);
      throw error;
    }
  }
};