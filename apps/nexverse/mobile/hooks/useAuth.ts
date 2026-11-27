// mobile/hooks/useAuth.ts

import { create } from 'zustand';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  User
} from 'firebase/auth';
import { auth } from '../services/firebase';
import axios from 'axios';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,
  
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      // Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Get ID token
      const token = await userCredential.user.getIdToken();
      
      // Sync with Django backend
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/api/auth/firebase-login/`,
        {
          firebase_uid: userCredential.user.uid,
          email: userCredential.user.email,
          token: token
        }
      );
      
      set({
        user: userCredential.user,
        token: response.data.access_token,
        isLoading: false
      });
      
      // Store token for API calls
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
      
    } catch (error: any) {
      set({
        error: error.message || 'Login failed',
        isLoading: false
      });
      throw error;
    }
  },
  
  register: async (email: string, password: string, username: string) => {
    set({ isLoading: true, error: null });
    try {
      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user in Django backend
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/api/users/register/`,
        {
          email,
          username,
          password,
          firebase_uid: userCredential.user.uid
        }
      );
      
      set({
        user: userCredential.user,
        token: response.data.access_token,
        isLoading: false
      });
      
    } catch (error: any) {
      set({
        error: error.message || 'Registration failed',
        isLoading: false
      });
      throw error;
    }
  },
  
  logout: async () => {
    try {
      await firebaseSignOut(auth);
      set({ user: null, token: null });
      delete axios.defaults.headers.common['Authorization'];
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },
  
  resetPassword: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      await sendPasswordResetEmail(auth, email);
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Password reset failed',
        isLoading: false
      });
      throw error;
    }
  },
  
  clearError: () => set({ error: null })
}));