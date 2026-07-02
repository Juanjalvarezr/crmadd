import { create } from 'zustand';

interface NotificationState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  showNotification: (message: string, severity: 'success' | 'error' | 'warning' | 'info', title?: string) => void;
  hideNotification: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  open: false,
  message: '',
  severity: 'info',
  title: '',
  showNotification: (message, severity, title) => set({ open: true, message, severity, title }),
  hideNotification: () => set({ open: false }),
}));