import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signOut as firebaseSignOut,
  updateProfile,
  deleteUser
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, firestore } from '../../lib/firebase';
import { AppUser, UserRole } from '../types/user.types';
import { registerFaculty, getUserRole, saveProfile, deleteUserData } from './firestore.service';

export const signIn = async (email: string, password: string): Promise<{uid: string, role: UserRole}> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;
  const role = await getUserRole(uid);
  return { uid, role };
};

export const signUp = async (
  email: string, 
  password: string, 
  displayName: string, 
  role: UserRole, 
  department?: string, 
  staffId?: string
): Promise<{uid: string, role: UserRole}> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;
  
  await updateProfile(userCredential.user, { displayName });
  
  // Set the user document
  const userRef = doc(firestore, `users/${uid}`);
  await setDoc(userRef, {
    uid,
    email,
    displayName,
    role,
    hasSeenTutorial: false
  });

  if (role === 'PENDING_FACULTY' && department && staffId) {
    await registerFaculty(uid, displayName, email, department, staffId);
  }

  return { uid, role };
};

export const sendPasswordReset = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};

export const signOut = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

export const getCurrentUser = (): AppUser | null => {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;
  
  // Note: we can't synchronously return the role from Firestore, 
  // so this acts as a base return. The store will enrich this with role.
  return {
    uid: currentUser.uid,
    email: currentUser.email || '',
    displayName: currentUser.displayName || '',
    photoUrl: currentUser.photoURL || undefined,
    role: 'STUDENT', // Default, should be overwritten by the store fetching role
  };
};

export const updateUserProfile = async (displayName: string, photoUri?: string): Promise<void> => {
  const currentUser = auth.currentUser;
  if (currentUser) {
    const finalPhotoUrl = photoUri || currentUser.photoURL || undefined;
    await updateProfile(currentUser, { 
      displayName, 
      photoURL: finalPhotoUrl 
    });
    await saveProfile(currentUser.uid, displayName, finalPhotoUrl);
  }
};

export const deleteAccount = async (): Promise<void> => {
  const currentUser = auth.currentUser;
  if (currentUser) {
    await deleteUserData(currentUser.uid);
    await deleteUser(currentUser);
  }
};
