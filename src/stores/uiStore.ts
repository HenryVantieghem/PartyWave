import { create } from 'zustand';

type Modal =
  | 'none'
  | 'createParty'
  | 'joinParty'
  | 'partySettings'
  | 'userProfile'
  | 'camera'
  | 'imageViewer'
  | 'confirmDialog';

type Toast = {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
};

type ConfirmDialog = {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'default';
};

type UIState = {
  // Modal State
  currentModal: Modal;
  modalData: any;

  // Toast State
  toasts: Toast[];

  // Confirm Dialog
  confirmDialog: ConfirmDialog | null;

  // Loading State
  globalLoading: boolean;
  loadingMessage: string | null;

  // Theme
  theme: 'light' | 'dark';

  // Navigation State
  previousScreen: string | null;
  navigationHistory: string[];

  // Image Viewer
  imageViewerData: {
    images: string[];
    initialIndex: number;
  } | null;

  // Bottom Sheet
  bottomSheetOpen: boolean;
  bottomSheetContent: React.ReactNode | null;

  // Actions
  openModal: (modal: Modal, data?: any) => void;
  closeModal: () => void;
  showToast: (
    message: string,
    type?: Toast['type'],
    duration?: number
  ) => void;
  hideToast: (id: string) => void;
  showConfirm: (dialog: ConfirmDialog) => void;
  hideConfirm: () => void;
  setGlobalLoading: (loading: boolean, message?: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setPreviousScreen: (screen: string) => void;
  addToNavigationHistory: (screen: string) => void;
  goBack: () => string | null;
  openImageViewer: (images: string[], initialIndex?: number) => void;
  closeImageViewer: () => void;
  openBottomSheet: (content: React.ReactNode) => void;
  closeBottomSheet: () => void;
};

let toastIdCounter = 0;

export const useUIStore = create<UIState>((set, get) => ({
  // Initial state
  currentModal: 'none',
  modalData: null,
  toasts: [],
  confirmDialog: null,
  globalLoading: false,
  loadingMessage: null,
  theme: 'dark',
  previousScreen: null,
  navigationHistory: [],
  imageViewerData: null,
  bottomSheetOpen: false,
  bottomSheetContent: null,

  // Open modal
  openModal: (modal, data) => {
    set({ currentModal: modal, modalData: data });
  },

  // Close modal
  closeModal: () => {
    set({ currentModal: 'none', modalData: null });
  },

  // Show toast
  showToast: (message, type = 'info', duration = 3000) => {
    const id = `toast-${toastIdCounter++}`;
    const toast: Toast = { id, message, type, duration };

    set({ toasts: [...get().toasts, toast] });

    // Auto-hide toast after duration
    if (duration > 0) {
      setTimeout(() => {
        get().hideToast(id);
      }, duration);
    }
  },

  // Hide toast
  hideToast: (id) => {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },

  // Show confirm dialog
  showConfirm: (dialog) => {
    set({ confirmDialog: dialog });
  },

  // Hide confirm dialog
  hideConfirm: () => {
    set({ confirmDialog: null });
  },

  // Set global loading
  setGlobalLoading: (loading, message) => {
    set({ globalLoading: loading, loadingMessage: message || null });
  },

  // Set theme
  setTheme: (theme) => {
    set({ theme });
  },

  // Toggle theme
  toggleTheme: () => {
    set({ theme: get().theme === 'light' ? 'dark' : 'light' });
  },

  // Set previous screen
  setPreviousScreen: (screen) => {
    set({ previousScreen: screen });
  },

  // Add to navigation history
  addToNavigationHistory: (screen) => {
    const history = get().navigationHistory;
    set({ navigationHistory: [...history, screen] });
  },

  // Go back
  goBack: () => {
    const history = get().navigationHistory;
    if (history.length > 0) {
      const previousScreen = history[history.length - 1];
      set({ navigationHistory: history.slice(0, -1) });
      return previousScreen;
    }
    return null;
  },

  // Open image viewer
  openImageViewer: (images, initialIndex = 0) => {
    set({
      imageViewerData: { images, initialIndex },
      currentModal: 'imageViewer',
    });
  },

  // Close image viewer
  closeImageViewer: () => {
    set({ imageViewerData: null, currentModal: 'none' });
  },

  // Open bottom sheet
  openBottomSheet: (content) => {
    set({ bottomSheetOpen: true, bottomSheetContent: content });
  },

  // Close bottom sheet
  closeBottomSheet: () => {
    set({ bottomSheetOpen: false, bottomSheetContent: null });
  },
}));
