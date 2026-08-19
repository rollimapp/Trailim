import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { mockUsers } from '../data/mockData';
import { getFirebaseServices, isFirebaseConfigured } from '../services/firebase/firebaseClient';
import { httpsCallable } from 'firebase/functions';
import { signInWithCustomToken, signOut } from 'firebase/auth';
import { getCallableFunctions } from '../services/firebase/versionReviewGateway';

interface AuthContextType {
  currentUser: User;
  activeRole: UserRole;
  switchUser: (userId: 'student-1' | 'teacher-1' | 'approver-1' | 'guest') => void;
  savedRouteIds: string[];
  toggleSaveRoute: (routeId: string) => void;
  language: 'en' | 'he';
  setLanguage: (lang: 'en' | 'he') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(mockUsers['student-1']);
  const [savedRouteIds, setSavedRouteIds] = useState<string[]>(['route-1', 'route-2']);
  const [language, setLanguage] = useState<'en' | 'he'>('en');

  // Sync RTL attributes when language changes
  useEffect(() => {
    document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const syncWithFirebase = async (userId: string) => {
    if (!isFirebaseConfigured()) return;
    try {
      const services = getFirebaseServices();
      if (userId === 'guest') {
        await signOut(services.auth);
        return;
      }
      const functions = getCallableFunctions();
      const seedCallable = httpsCallable(functions, 'devSeedDatabase');
      await seedCallable();

      const tokenCallable = httpsCallable(functions, 'getDevCustomToken');
      const tokenResult = await tokenCallable({ uid: userId });
      const token = (tokenResult.data as any).token;

      await signInWithCustomToken(services.auth, token);
      console.log(`Successfully authenticated in Firebase Auth as: ${userId}`);
    } catch (error) {
      console.error('Firebase Auth sync failed:', error);
    }
  };

  useEffect(() => {
    syncWithFirebase('student-1');
  }, []);

  const switchUser = (userId: 'student-1' | 'teacher-1' | 'approver-1' | 'guest') => {
    if (userId === 'guest') {
      setCurrentUser({
        id: 'guest-user',
        name: 'Guest Explorer',
        email: 'guest@trailim.app',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
        role: 'guest',
        capabilities: {
          canCreateRoutes: false,
          canEditOwnRoutes: false,
          canEditOrgRoutes: false,
          canReviewSubmitted: false,
          canPublishDirectly: false,
          canAssignRoutes: false,
          canViewResults: false,
          canManageUsers: false,
        },
        totalPoints: 0,
        completedRoutesCount: 0,
        createdRoutesCount: 0,
        earnedBadges: [],
        languagePreference: language,
      });
    } else {
      setCurrentUser(mockUsers[userId] || mockUsers['student-1']);
    }
    syncWithFirebase(userId);
  };


  const toggleSaveRoute = (routeId: string) => {
    setSavedRouteIds(prev => 
      prev.includes(routeId) ? prev.filter(id => id !== routeId) : [...prev, routeId]
    );
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      activeRole: currentUser.role,
      switchUser,
      savedRouteIds,
      toggleSaveRoute,
      language,
      setLanguage,
    }}>
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
