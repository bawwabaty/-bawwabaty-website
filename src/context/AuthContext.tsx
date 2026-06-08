import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface UserProfile {
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt?: any;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (e: string, p: string) => Promise<void>;
  registerWithEmail: (n: string, e: string, p: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Using email matching to identify admins from user request
const checkIsAdmin = (email: string | null) => {
  if (!email) return false;
  return email.toLowerCase() === 'bawwabaty@gmail.com' || 
         email.toLowerCase() === 'abdellatifbawwabaty@gmail.com' || 
         email.toLowerCase().includes('@bawwabaty');
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.email) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          
          let role: 'admin' | 'user' = checkIsAdmin(currentUser.email) ? 'admin' : 'user';
          
          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            if (role === 'admin' && data.role !== 'admin') {
              // Upgrade legacy user to admin if they match checkIsAdmin
              await setDoc(userDocRef, { role: 'admin' }, { merge: true });
              data.role = 'admin';
            }
            setProfile(data);
          } else {
            // Create user profile
            const newProfile: any = {
              name: currentUser.displayName || 'مستخدم',
              email: currentUser.email,
              role,
              createdAt: serverTimestamp(),
            };
            await setDoc(userDocRef, newProfile);
            setProfile(newProfile);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Login Error: ", error);
      if (error.code === 'auth/unauthorized-domain') {
        throw new Error('يرجى إضافة دومين الموقع في Firebase Authentication (Authorized Domains)');
      }
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      console.error("Email Login Error: ", error);
      throw error;
    }
  };

  const registerWithEmail = async (name: string, email: string, pass: string) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      // Profile will be created automatically in onAuthStateChanged,
      // but displayName won't be set initially, we can update it in db if we want.
      const userDocRef = doc(db, 'users', res.user.uid);
      const role: 'admin' | 'user' = checkIsAdmin(email) ? 'admin' : 'user';
      const newProfile: any = {
        name: name || 'مستخدم',
        email: email,
        role,
        createdAt: serverTimestamp(),
      };
      await setDoc(userDocRef, newProfile);
      setProfile(newProfile);
    } catch (error: any) {
      console.error("Email Register Error: ", error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const isAdmin = profile?.role === 'admin' || checkIsAdmin(user?.email || null);

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, loginWithGoogle, loginWithEmail, registerWithEmail, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
