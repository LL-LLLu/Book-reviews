import { create } from 'zustand';
import { signIn as nextAuthSignIn, signOut as nextAuthSignOut, getSession } from 'next-auth/react';
import api from './api';

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  avatar?: string;
  bio?: string;
  favoriteGenres?: string[];
  googleId?: string;
  passwordSetup?: boolean;
  createdAt?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  requirePasswordSetup: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  googleSignIn: () => Promise<void>;
  logout: () => void;
  checkAuth: (forceRefresh?: boolean) => Promise<void>;
  setPasswordSetupComplete: () => void;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  requirePasswordSetup: false,
  
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;
    
    localStorage.setItem('token', token);
    set({ user, token, isLoading: false });
  },
  
  register: async (username: string, email: string, password: string) => {
    const response = await api.post('/auth/register', { username, email, password });
    const { token, user } = response.data;
    
    localStorage.setItem('token', token);
    set({ user, token, isLoading: false });
  },

  googleSignIn: async () => {
    try {
      const result = await nextAuthSignIn('google', { 
        callbackUrl: '/',
        redirect: false 
      });
      
      if (result?.ok) {
        // Get the session after successful sign in
        const session = await getSession();
        if (session?.accessToken && session?.user) {
          localStorage.setItem('token', session.accessToken);
          
          // Check if user needs to set up password
          const requirePasswordSetup = !!(session.user.googleId && !session.user.passwordSetup);
          
          set({ 
            user: session.user, 
            token: session.accessToken,
            isLoading: false,
            requirePasswordSetup
          });
        }
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    nextAuthSignOut({ callbackUrl: '/' });
    set({ user: null, token: null });
  },
  
  checkAuth: async (forceRefresh = false) => {
    console.log('checkAuth called with forceRefresh:', forceRefresh);
    
    // Always try to get fresh data from API first if we have a token or forceRefresh is true
    const session = await getSession();
    const token = session?.accessToken || localStorage.getItem('token');
    
    console.log('Auth check:', {
      hasSession: !!session,
      hasToken: !!token,
      sessionUser: session?.user?.email,
      forceRefresh
    });
    
    if (token && (forceRefresh || true)) { // Always fetch fresh data for now
      try {
        console.log('Fetching fresh user data from API...');
        const response = await api.get('/auth/me');
        console.log('Fresh user data received:', {
          userId: response.data.user._id,
          email: response.data.user.email,
          avatar: response.data.user.avatar
        });
        
        if (session?.accessToken) {
          localStorage.setItem('token', session.accessToken);
        }
        // Check if Google user needs to set up password
        const requirePasswordSetup = !!(response.data.user.googleId && !response.data.user.passwordSetup);
        
        set({ 
          user: response.data.user, 
          token: token,
          isLoading: false,
          requirePasswordSetup
        });
        return;
      } catch (error) {
        console.log('Failed to fetch fresh user data, falling back to session:', error);
        // If API fails, fall back to session data for Google users
        if (session?.accessToken && session?.user && !forceRefresh) {
          localStorage.setItem('token', session.accessToken);
          
          // Check if user needs password setup from session data
          const requirePasswordSetup = !!(session.user.googleId && !session.user.passwordSetup);
          
          set({ 
            user: session.user, 
            token: session.accessToken,
            isLoading: false,
            requirePasswordSetup
          });
          return;
        }
        // Clear invalid token
        localStorage.removeItem('token');
        set({ user: null, token: null, isLoading: false, requirePasswordSetup: false });
        return;
      }
    }

    // If no token available
    if (!token) {
      console.log('No token available, setting loading false');
      set({ isLoading: false, requirePasswordSetup: false });
      return;
    }
  },

  setPasswordSetupComplete: () => {
    const { user } = get();
    if (user) {
      set({ 
        user: { ...user, passwordSetup: true },
        requirePasswordSetup: false
      });
    }
  },
}));