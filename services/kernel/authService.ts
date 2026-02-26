import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User as FirebaseUser,
    GoogleAuthProvider,
    signInWithPopup
} from "firebase/auth";
import { auth } from "./firebase";

const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = () => {
    return signInWithPopup(auth, googleProvider);
};

export const loginUser = (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
};

export const registerUser = (email: string, pass: string) => {
    return createUserWithEmailAndPassword(auth, email, pass);
};

export const logoutUser = () => {
    return signOut(auth);
};

export const subscribeToAuth = (callback: (user: FirebaseUser | null) => void) => {
    return onAuthStateChanged(auth, callback);
};
