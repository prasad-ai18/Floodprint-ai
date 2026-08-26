import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
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
  loginWithGoogle: () => Promise<void>;
  signup: (email: string, pass: string, displayName?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      // In local mode, check localStorage for stored session
      const stored = localStorage.getItem('floodprint_user_session');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setCurrentUser(parsed.user);
          setUserProfile(parsed.profile);
        } catch {
          // Clear corrupt
        }
      }
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
              displayName: user.displayName || user.email?.split('@')[0],
              createdAt: new Date().toISOString(),
              role: 'responder',
            };
            await setDoc(userDocRef, initialProfile);
            setUserProfile(initialProfile);
          }
        } catch (err) {
          console.warn('Profile sync notice:', err);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    setError(null);
    setLoading(true);
    try {
      if (!isFirebaseConfigured) {
        // Local mode session persistence
        const userObj = {
          uid: `user_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
          email,
          displayName: email.split('@')[0],
        } as unknown as User;
        const profileObj: UserProfile = {
          uid: userObj.uid,
          email,
          displayName: email.split('@')[0],
          createdAt: new Date().toISOString(),
          role: 'responder',
        };
        localStorage.setItem('floodprint_user_session', JSON.stringify({ user: userObj, profile: profileObj }));
        setCurrentUser(userObj);
        setUserProfile(profileObj);
        return;
      }

      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      let msg = 'Failed to sign in. Please verify your credentials.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Invalid email address or password.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many failed login attempts. Please reset your password or try again later.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      if (!isFirebaseConfigured) {
        throw new Error('Google Sign-In is not configured for this Firebase project.');
      }
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      let msg = 'Google Sign-In is not configured for this Firebase project.';
      if (err.code === 'auth/popup-closed-by-user') {
        msg = 'Sign-in popup was closed before completing.';
      } else if (err.code === 'auth/operation-not-allowed') {
        msg = 'Google Sign-In is not enabled in the Firebase Console.';
      } else if (err.message && !err.message.includes('API key')) {
        msg = err.message;
      }
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, pass: string, displayName?: string) => {
    setError(null);
    setLoading(true);
    try {
      if (!isFirebaseConfigured) {
        const userObj = {
          uid: `user_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
          email,
          displayName: displayName || email.split('@')[0],
        } as unknown as User;
        const profileObj: UserProfile = {
          uid: userObj.uid,
          email,
          displayName: displayName || email.split('@')[0],
          createdAt: new Date().toISOString(),
          role: 'responder',
        };
        localStorage.setItem('floodprint_user_session', JSON.stringify({ user: userObj, profile: profileObj }));
        setCurrentUser(userObj);
        setUserProfile(profileObj);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
      }

      const newProfile: UserProfile = {
        uid: userCredential.user.uid,
        email: userCredential.user.email || email,
        displayName: displayName || email.split('@')[0],
        createdAt: new Date().toISOString(),
        role: 'responder',
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), newProfile);
      setUserProfile(newProfile);
    } catch (err: any) {
      let msg = 'Failed to create account.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'This email address is already registered. Please sign in.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setError(null);
    if (!email) {
      throw new Error('Please enter your email address to receive password reset instructions.');
    }
    if (!isFirebaseConfigured) {
      throw new Error('Password reset is available once production email service is configured.');
    }
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      let msg = 'Failed to send password reset email.';
      if (err.code === 'auth/user-not-found') {
        msg = 'No registered account found with this email address.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
      throw err;
    }
  };

  const logout = async () => {
    setError(null);
    try {
      if (isFirebaseConfigured) {
        await firebaseSignOut(auth);
      }
      localStorage.removeItem('floodprint_user_session');
      setCurrentUser(null);
      setUserProfile(null);
    } catch (err: any) {
      setError(err.message || 'Failed to sign out.');
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
        loginWithGoogle,
        signup,
        resetPassword,
        logout,
        clearError,
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
