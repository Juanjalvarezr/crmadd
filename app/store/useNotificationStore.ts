import { create } from 'zustand';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
  read: boolean;
  createdAt: string;
}

interface NotificationState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  items: NotificationItem[];
  showNotification: (message: string, severity: 'success' | 'error' | 'warning' | 'info', title?: string) => void;
  hideNotification: () => void;
  addItem: (item: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>) => void;
  markRead: (id: string) => void;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  open: false,
  message: '',
  severity: 'info',
  title: '',
  items: [],
  showNotification: (message, severity, title) => {
    const id = crypto.randomUUID();
    const item: NotificationItem = { id, title: title || '', message, severity, read: false, createdAt: new Date().toISOString() };
    set((state) => ({ open: true, message, severity, title: title || '', items: [item, ...state.items].slice(0, 100) }));
    setTimeout(() => get().markRead(id), 5000);
  },
  hideNotification: () => set({ open: false }),
  addItem: (item) => set((state) => ({ items: [{ ...item, id: crypto.randomUUID(), createdAt: new Date().toISOString(), read: false }, ...state.items].slice(0, 100) })),
  markRead: (id) => set((state) => ({ items: state.items.map((item) => (item.id === id ? { ...item, read: true } : item)) })),
  unreadCount: () => get().items.filter((item) => !item.read).length,
}));
