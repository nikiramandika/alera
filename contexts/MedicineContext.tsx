import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { medicineService, medicineHistoryService } from '@/services';
import { notificationScheduler } from '@/services/notificationScheduler';
import { MedicineReminder, MedicineHistory } from '@/types';

interface MedicineContextType {
  medicines: MedicineReminder[];
  medicineHistory: MedicineHistory[];
  loading: boolean;
  addMedicine: (medicine: Omit<MedicineReminder, 'reminderId' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; error?: string }>;
  updateMedicine: (id: string, medicine: Partial<MedicineReminder>) => Promise<{ success: boolean; error?: string }>;
  deleteMedicine: (id: string) => Promise<{ success: boolean; error?: string }>;
  markMedicineTaken: (reminderId: string, scheduledTime: Date, actualTime?: Date) => Promise<{ success: boolean; error?: string }>;
  markMedicineSkipped: (reminderId: string, scheduledTime: Date) => Promise<{ success: boolean; error?: string }>;
  getOverdueMeds: () => MedicineReminder[];
  getTodaySchedule: () => MedicineReminder[];
  refreshMedicines: () => Promise<void>;
  getMedicineHistoryForDateRange: (startDate: Date, endDate: Date) => Promise<MedicineHistory[]>;
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
  const fetchData = useCallback(async () => {
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
  }, [user]);

  // Add new medicine
  const addMedicine = async (medicine: Omit<MedicineReminder, 'reminderId' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      console.log('🔍 [DEBUG] Adding medicine:', medicine.medicineName);
      console.log('🔍 [DEBUG] Frequency times:', medicine.frequency.times);
      console.log('🔍 [DEBUG] Frequency type:', medicine.frequency.type);

      // Add medicine to database first
      const medicineId = await medicineService.addMedicine(user.userId, medicine);
      console.log('🔍 [DEBUG] Medicine added with ID:', medicineId);

      // Schedule real-time notifications for each dose time
      const timesToSchedule = medicine.frequency?.times || [];
      console.log('🔍 [DEBUG] Times to schedule for real-time checking:', timesToSchedule);

      if (timesToSchedule.length > 0 && medicineId) {

        for (const time of timesToSchedule) {
          console.log('🔍 [DEBUG] Adding real-time notification scheduler for time:', time);

          // Add to notification scheduler for real-time checking
          await notificationScheduler.addNotification({
            medicineId: medicineId,
            time: time,
            title: '💊 Medicine Reminder',
            body: `Time to take ${medicine.medicineName}${medicine.dosage ? ` (${medicine.dosage})` : ''}`,
            type: 'medicine',
          });

          console.log('✅ [DEBUG] Real-time notification scheduler added for time:', time);
        }

        console.log('🔍 [DEBUG] Total real-time notifications scheduled:', timesToSchedule.length);
      } else {
        console.log('⚠️ [DEBUG] No times to schedule real-time notifications for');
      }

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
      // Get the existing medicine before updating
      const existingMedicine = medicines.find(m => m.reminderId === id);

      // Remove old real-time notifications
      if (existingMedicine) {
        await notificationScheduler.removeNotifications(existingMedicine.reminderId);
        console.log('🔍 [DEBUG] Update - Removed old real-time notifications');
      }

      // Apply the updates
      await medicineService.updateMedicine(user.userId, id, updates);

      // Get the updated medicine
      const updatedMedicine = { ...existingMedicine, ...updates };
      const timesToSchedule = updatedMedicine.frequency?.times || [];
      console.log('🔍 [DEBUG] Update - Times to reschedule for real-time:', timesToSchedule);

      // Add new real-time notifications
      if (timesToSchedule.length > 0) {
        for (const time of timesToSchedule) {
          console.log('🔍 [DEBUG] Update - Adding real-time notification for time:', time);

          await notificationScheduler.addNotification({
            medicineId: id,
            time: time,
            title: '💊 Medicine Reminder',
            body: `Time to take ${updatedMedicine.medicineName}${updatedMedicine.dosage ? ` (${updatedMedicine.dosage})` : ''}`,
            type: 'medicine',
          });

          console.log('✅ [DEBUG] Update - Real-time notification added for time:', time);
        }

        console.log('🔍 [DEBUG] Update - Total real-time notifications rescheduled:', timesToSchedule.length);
      } else {
        console.log('⚠️ [DEBUG] Update - No times to schedule real-time notifications');
      }

      await fetchData(); // Refresh data
      return { success: true };
    } catch (error) {
      console.error('Error updating medicine:', error);
      return { success: false, error: 'Failed to update medicine' };
    }
  };

 
    const deleteMedicine = async (id: string) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      await notificationScheduler.removeNotifications(id);
      console.log('🔍 [DEBUG] Delete - Removed real-time notifications for medicine:', id);

      
      await medicineService.deleteMedicine(user.userId, id);

      await fetchData(); 
      return { success: true };
    } catch (error) {
      console.error('Error deleting medicine:', error);
      return { success: false, error: 'Failed to delete medicine' };
    }
  };


  // Mark medicine as taken
  const markMedicineTaken = async (reminderId: string, scheduledTime: Date, actualTime?: Date) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      await medicineHistoryService.markMedicineTaken(user.userId, reminderId, scheduledTime, actualTime);
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
      await medicineHistoryService.markMedicineMissed(user.userId, reminderId, scheduledTime);
      await fetchData(); // Refresh data
      return { success: true };
    } catch (error) {
      console.error('Error marking medicine as skipped:', error);
      return { success: false, error: 'Failed to mark medicine as skipped' };
    }
  };

  // Get today's scheduled medicines
const getTodaySchedule = () => {
  const today = new Date().getDay(); // 0 = Sunday ... 6 = Saturday

  return medicines.filter(med => {
    const freq = med.frequency;

    if (freq.type === 'daily') return true;

    if (freq.type === 'interval') {
      return Array.isArray(freq.specificDays) && freq.specificDays.includes(today);
    }

    return false;
  });
};

// Get overdue medicines
const getOverdueMeds = () => {
  const now = new Date();
  const todayMeds = getTodaySchedule();

  return todayMeds.filter(med => {
    const { times } = med.frequency;

    if (!Array.isArray(times)) return false;

    return times.some(timeStr => {
      const [h, m] = timeStr.split(':').map(Number);

      const scheduled = new Date();
      scheduled.setHours(h, m, 0, 0);

      return scheduled < now;
    });
  });
};


  // Refresh medicine data
  const refreshMedicines = async () => {
    await fetchData();
  };

  // Get medicine history for date range
  const getMedicineHistoryForDateRange = async (startDate: Date, endDate: Date): Promise<MedicineHistory[]> => {
    if (!user) return [];
    try {
      return await medicineHistoryService.getMedicineHistoryForDateRange(user.userId, startDate, endDate);
    } catch (error) {
      console.error('Error getting medicine history for date range:', error);
      return [];
    }
  };

  // Fetch data when user changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    getMedicineHistoryForDateRange,
  };

  return (
    <MedicineContext.Provider value={value}>
      {children}
    </MedicineContext.Provider>
  );
};