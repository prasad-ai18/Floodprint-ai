import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isDemoMode = !isFirebaseConfigured;

  useEffect(() => {
    if (isDemoMode) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            setUserProfile(userSnap.data() as UserProfile);
          } else {
            const initialProfile: UserProfile = {
              uid: user.uid,
              email: user.email || 'user@floodprint.ai',
              displayName: user.displayName || undefined,
              createdAt: new Date().toISOString(),
              role: 'citizen',
            };
            await setDoc(userDocRef, initialProfile);
            setUserProfile(initialProfile);
          }
        } catch (err) {
          console.warn('Error fetching user profile document:', err);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isDemoMode]);

  const login = async (email: string, pass: string) => {
    setError(null);
    setLoading(true);
    try {
      if (isDemoMode) {
        // Fallback demo user for local UI preview before user adds production keys
        const mockUser = {
          uid: 'demo_user_123',
          email,
          displayName: email.split('@')[0],
        } as unknown as User;
        setCurrentUser(mockUser);
        setUserProfile({
          uid: 'demo_user_123',
          email,
          displayName: email.split('@')[0],
          createdAt: new Date().toISOString(),
          role: 'citizen',
        });
        return;
      }
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to sign in. Please check your credentials.';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, pass: string, displayName?: string) => {
    setError(null);
    setLoading(true);
    try {
      if (isDemoMode) {
        const mockUser = {
          uid: 'demo_user_123',
          email,
          displayName: displayName || email.split('@')[0],
        } as unknown as User;
        setCurrentUser(mockUser);
        setUserProfile({
          uid: 'demo_user_123',
          email,
          displayName: displayName || email.split('@')[0],
          createdAt: new Date().toISOString(),
          role: 'citizen',
        });
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
      }

      const newProfile: UserProfile = {
        uid: userCredential.user.uid,
        email: userCredential.user.email || email,
        displayName: displayName || undefined,
        createdAt: new Date().toISOString(),
        role: 'citizen',
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), newProfile);
      setUserProfile(newProfile);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create account. Please try again.';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setError(null);
    try {
      if (!isDemoMode) {
        await firebaseSignOut(auth);
      }
      setCurrentUser(null);
      setUserProfile(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to sign out.';
      setError(msg);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        error,
        login,
        signup,
        logout,
        clearError,
        isDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
