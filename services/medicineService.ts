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
  addDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { MedicineReminder, MedicineHistory } from '@/types';

// MEDICINES COLLECTION (subcollection under users)
export const medicineService = {
  // Add new medicine
  async addMedicine(userId: string, medicine: Omit<MedicineReminder, 'reminderId' | 'createdAt' | 'updatedAt'>): Promise<string> {
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

  // Get all active medicines
  async getMedicines(userId: string): Promise<MedicineReminder[]> {
    try {
      console.log('🔍 [DEBUG] Fetching medicines for userId:', userId);
      const medicinesRef = collection(db, 'users', userId, 'medicines');
      const q = query(medicinesRef, where('isActive', '==', true));
      console.log('🔍 [DEBUG] Query created, executing...');
      const querySnapshot = await getDocs(q);
      console.log('🔍 [DEBUG] Query executed, docs found:', querySnapshot.docs.length);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          reminderId: doc.id,
          stock: {
            current: data.stock?.current || 0,
            currentStock: data.stock?.currentStock || data.stockQuantity || 0,
            refillThreshold: data.stock?.refillThreshold || data.stockAlert || 5,
            unit: data.stock?.unit || 'units',
            lastUpdated: data.stock?.lastUpdated?.toDate?.() || new Date()
          },
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date()
        };
      }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) as MedicineReminder[];
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
          stock: {
            current: data.stock?.current || 0,
            currentStock: data.stock?.currentStock || data.stockQuantity || 0,
            refillThreshold: data.stock?.refillThreshold || data.stockAlert || 5,
            unit: data.stock?.unit || 'units',
            lastUpdated: data.stock?.lastUpdated?.toDate?.() || new Date()
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
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

      return medicines.filter(medicine => {
        // Check if medicine should be taken today
        if (medicine.frequency.type === 'daily') return true;
        if (medicine.frequency.type === 'specific_days') {
          return medicine.frequency.specificDays?.includes(dayNames[today]);
        }
        if (medicine.frequency.type === 'interval') {
          // Logic for interval-based frequency
          const daysSinceStart = Math.floor((Date.now() - medicine.createdAt.getTime()) / (1000 * 60 * 60 * 24));
          return daysSinceStart % medicine.frequency.interval === 0;
        }
        return false;
      });
    } catch (error) {
      console.error('Error getting today medicines:', error);
      throw error;
    }
  },

  // Update stock
  async updateStock(userId: string, medicineId: string, newStock: number): Promise<void> {
    try {
      await this.updateMedicine(userId, medicineId, {
        stock: {
          current: newStock,
          currentStock: newStock,
          refillThreshold: 5,
          unit: 'units',
          lastUpdated: new Date()
        }
      });
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  },

  // Check for low stock
  async getLowStockMedicines(userId: string): Promise<MedicineReminder[]> {
    try {
      const medicines = await this.getMedicines(userId);
      return medicines.filter(medicine =>
        medicine.stock.currentStock <= medicine.stock.refillThreshold
      );
    } catch (error) {
      console.error('Error getting low stock medicines:', error);
      throw error;
    }
  }
};

// MEDICINE HISTORY COLLECTION (subcollection under medicines)
export const medicineHistoryService = {
  // Add medicine intake record
  async addMedicineHistory(userId: string, medicineId: string, history: Omit<MedicineHistory, 'historyId' | 'createdAt'>): Promise<string> {
    try {
      const historyRef = collection(db, 'users', userId, 'medicines', medicineId, 'history');
      const docRef = await addDoc(historyRef, {
        ...history,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding medicine history:', error);
      throw error;
    }
  },

  // Get medicine history
  async getMedicineHistory(userId: string, medicineId: string, limit = 30): Promise<MedicineHistory[]> {
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
        const history = await this.getMedicineHistory(userId, medicine.reminderId, 10);
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
        status: 'taken',
        notes: ''
      });

      // Update stock if medicine was taken
      const medicine = await medicineService.getMedicineById(userId, medicineId);
      if (medicine && medicine.stock.currentStock > 0) {
        await medicineService.updateStock(userId, medicineId, medicine.stock.currentStock - 1);
      }
    } catch (error) {
      console.error('Error marking medicine as taken:', error);
      throw error;
    }
  },

  // Mark medicine as missed
  async markMedicineMissed(userId: string, medicineId: string, scheduledTime: Date, notes?: string): Promise<void> {
    try {
      await this.addMedicineHistory(userId, medicineId, {
        medicineId,
        scheduledTime,
        status: 'missed',
        notes: notes || ''
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
        const history = await this.getMedicineHistory(userId, medicine.reminderId, 100);
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