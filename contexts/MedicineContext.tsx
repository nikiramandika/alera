import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { medicineService, medicineHistoryService } from '@/services';
import { MedicineReminder, MedicineHistory } from '@/types';

interface MedicineContextType {
  medicines: MedicineReminder[];
  medicineHistory: MedicineHistory[];
  loading: boolean;
  addMedicine: (medicine: Omit<MedicineReminder, 'reminderId' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; error?: string }>;
  updateMedicine: (id: string, medicine: Partial<MedicineReminder>) => Promise<{ success: boolean; error?: string }>;
  deleteMedicine: (id: string) => Promise<{ success: boolean; error?: string }>;
  markMedicineTaken: (reminderId: string, scheduledTime: Date) => Promise<{ success: boolean; error?: string }>;
  markMedicineSkipped: (reminderId: string, scheduledTime: Date) => Promise<{ success: boolean; error?: string }>;
  getTodaySchedule: () => MedicineReminder[];
  getOverdueMeds: () => MedicineReminder[];
  refreshMedicines: () => Promise<void>;
}

const MedicineContext = createContext<MedicineContextType | undefined>(undefined);

export const useMedicine = () => {
  const context = useContext(MedicineContext);
  if (context === undefined) {
    throw new Error('useMedicine must be used within a MedicineProvider');
  }
  return context;
};

export const MedicineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<MedicineReminder[]>([]);
  const [medicineHistory, setMedicineHistory] = useState<MedicineHistory[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch medicines and history
  const fetchData = async () => {
    console.log('🔍 [DEBUG] MedicineContext fetchData called');
    console.log('🔍 [DEBUG] User state:', user ? { userId: user.userId, email: user.email } : 'No user');

    if (!user) {
      console.log('🔍 [DEBUG] No user found, setting empty data');
      setMedicines([]);
      setMedicineHistory([]);
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 [DEBUG] Starting data fetch for userId:', user.userId);
      setLoading(true);
      const [medicinesData, historyData] = await Promise.all([
        medicineService.getMedicines(user.userId),
        medicineHistoryService.getTodayMedicineHistory(user.userId)
      ]);

      setMedicines(medicinesData);
      setMedicineHistory(historyData);
    } catch (error) {
      console.error('Error fetching medicine data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add new medicine
  const addMedicine = async (medicine: Omit<MedicineReminder, 'reminderId' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      await medicineService.addMedicine(user.userId, medicine);
      await fetchData(); // Refresh data
      return { success: true };
    } catch (error) {
      console.error('Error adding medicine:', error);
      return { success: false, error: 'Failed to add medicine' };
    }
  };

  // Update medicine
  const updateMedicine = async (id: string, updates: Partial<MedicineReminder>) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      await medicineService.updateMedicine(user.userId, id, updates);
      await fetchData(); // Refresh data
      return { success: true };
    } catch (error) {
      console.error('Error updating medicine:', error);
      return { success: false, error: 'Failed to update medicine' };
    }
  };

  // Delete medicine
  const deleteMedicine = async (id: string) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      await medicineService.deleteMedicine(user.userId, id);
      await fetchData(); // Refresh data
      return { success: true };
    } catch (error) {
      console.error('Error deleting medicine:', error);
      return { success: false, error: 'Failed to delete medicine' };
    }
  };

  // Mark medicine as taken
  const markMedicineTaken = async (reminderId: string, scheduledTime: Date) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      await medicineHistoryService.markMedicineTaken(user.userId, reminderId, scheduledTime);
      await fetchData(); // Refresh data to update stock
      return { success: true };
    } catch (error) {
      console.error('Error marking medicine as taken:', error);
      return { success: false, error: 'Failed to mark medicine as taken' };
    }
  };

  // Mark medicine as skipped/missed
  const markMedicineSkipped = async (reminderId: string, scheduledTime: Date) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      await medicineHistoryService.markMedicineMissed(user.userId, reminderId, scheduledTime, 'Skipped');
      await fetchData(); // Refresh data
      return { success: true };
    } catch (error) {
      console.error('Error marking medicine as skipped:', error);
      return { success: false, error: 'Failed to mark medicine as skipped' };
    }
  };

  // Get today's scheduled medicines
  const getTodaySchedule = () => {
    const now = new Date();
    return medicines.filter(medicine => {
      // Check if medicine should be taken today
      if (medicine.frequency.type === 'daily') return true;
      if (medicine.frequency.type === 'specific_days') {
        const today = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        return medicine.frequency.specificDays?.includes(today);
      }
      if (medicine.frequency.type === 'interval') {
        const daysSinceStart = Math.floor((now.getTime() - medicine.createdAt.getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceStart % medicine.frequency.interval === 0;
      }
      return false;
    });
  };

  // Get overdue medicines
  const getOverdueMeds = () => {
    const now = new Date();
    const todaySchedule = getTodaySchedule();

    return todaySchedule.filter(medicine => {
      return medicine.times.some(time => {
        const [hours, minutes] = time.split(':').map(Number);
        const scheduledTime = new Date();
        scheduledTime.setHours(hours, minutes, 0, 0);

        return scheduledTime < now; // Medicine time has passed
      });
    });
  };

  // Refresh medicine data
  const refreshMedicines = async () => {
    await fetchData();
  };

  // Fetch data when user changes
  useEffect(() => {
    fetchData();
  }, [user]);

  const value: MedicineContextType = {
    medicines,
    medicineHistory,
    loading,
    addMedicine,
    updateMedicine,
    deleteMedicine,
    markMedicineTaken,
    markMedicineSkipped,
    getTodaySchedule,
    getOverdueMeds,
    refreshMedicines,
  };

  return (
    <MedicineContext.Provider value={value}>
      {children}
    </MedicineContext.Provider>
  );
};