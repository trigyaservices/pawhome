import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onIdTokenChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile as updateAuthProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const AuthContext = createContext({
  user: null,
  profile: null,
  role: 'visitor',
  isAdmin: false,
  loading: true,
  login: async () => {},
  signup: async () => {},
  loginWithGoogle: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
  updateProfileData: async () => {},
  refreshClaims: async () => {}
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState('visitor');
  const [loading, setLoading] = useState(true);

  const fetchProfileAndRole = async (firebaseUser, forceTokenRefresh = false) => {
    if (!firebaseUser) {
      setUser(null);
      setProfile(null);
      setRole('visitor');
      setLoading(false);
      return;
    }

    try {
      const idTokenResult = await firebaseUser.getIdTokenResult(forceTokenRefresh);
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      const hasAdminClaim = idTokenResult.claims.role === 'admin';
      const determinedRole = hasAdminClaim ? 'admin' : (userDocSnap.exists() && userDocSnap.data().role === 'admin' ? 'admin' : 'user');

      if (!userDocSnap.exists()) {
        const newProfile = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email || '',
          phone: firebaseUser.phoneNumber || '',
          city: '',
          country: 'India',
          role: determinedRole,
          createdAt: serverTimestamp()
        };
        await setDoc(userDocRef, newProfile);
        setProfile(newProfile);
      } else {
        setProfile(userDocSnap.data());
      }

      setUser(firebaseUser);
      setRole(determinedRole);
    } catch (err) {
      console.error('Error fetching user profile/claims:', err);
      setUser(firebaseUser);
      setRole('user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      await fetchProfileAndRole(firebaseUser);
    });
    return unsubscribe;
  }, []);

  const refreshClaims = async () => {
    if (auth.currentUser) {
      await fetchProfileAndRole(auth.currentUser, true);
    }
  };

  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await fetchProfileAndRole(cred.user, true);
    return cred.user;
  };

  const signup = async (email, password, extraData = {}) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (extraData.name) {
      await updateAuthProfile(cred.user, { displayName: extraData.name });
    }
    const userDocRef = doc(db, 'users', cred.user.uid);
    const newProfile = {
      uid: cred.user.uid,
      name: extraData.name || cred.user.email?.split('@')[0] || 'User',
      email: cred.user.email || '',
      phone: extraData.phone || '',
      city: extraData.city || '',
      country: extraData.country || 'India',
      role: 'user',
      createdAt: serverTimestamp()
    };
    await setDoc(userDocRef, newProfile);
    setProfile(newProfile);
    setUser(cred.user);
    setRole('user');
    return cred.user;
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const cred = await signInWithPopup(auth, provider);
    await fetchProfileAndRole(cred.user, true);
    return cred.user;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
    setRole('visitor');
  };

  const resetPassword = async (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  const updateProfileData = async (newData) => {
    if (!user) throw new Error('Not logged in');
    const userDocRef = doc(db, 'users', user.uid);
    await updateDoc(userDocRef, {
      ...newData,
      updatedAt: serverTimestamp()
    });
    setProfile((prev) => ({ ...prev, ...newData }));
    if (newData.name && newData.name !== user.displayName) {
      await updateAuthProfile(user, { displayName: newData.name });
    }
  };

  const value = {
    user,
    profile,
    role,
    isAdmin: role === 'admin',
    loading,
    login,
    signup,
    loginWithGoogle,
    logout,
    resetPassword,
    updateProfileData,
    refreshClaims
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
