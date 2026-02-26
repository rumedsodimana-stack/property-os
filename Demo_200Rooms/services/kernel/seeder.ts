import { db } from './firebase';
import { collection, doc, setDoc, getDocs, writeBatch } from 'firebase/firestore';
import { registerUser } from './authService';
// import * as mockData from './mockData';

export const seedDatabase = async () => {
    console.warn("Seeding disabled: mockData.ts has been removed.");
    /*
    // ... previous implementation ...
    */
};
