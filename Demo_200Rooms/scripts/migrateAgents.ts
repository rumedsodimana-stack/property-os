import { initializeApp } from "firebase/app";
import {
    getFirestore,
    collection,
    getDocs,
    updateDoc,
    doc,
    query,
    where
} from "firebase/firestore";
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateModels() {
    console.log('🔄 Migrating AI Agent model names in Firestore...');

    const agentsRef = collection(db, 'ai_agents');
    const q = query(agentsRef, where("model", "==", "claude-sonnet-4-6"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        console.log('✅ No agents found with the invalid model name.');
        process.exit(0);
    }

    console.log(`Found ${snapshot.size} agents to update.`);

    for (const agentDoc of snapshot.docs) {
        console.log(`Updating agent: ${agentDoc.data().name}...`);
        await updateDoc(doc(db, 'ai_agents', agentDoc.id), {
            model: 'claude-3-5-sonnet-20241022'
        });
    }

    console.log('🎉 Migration complete! All agents now use claude-3-5-sonnet-20241022.');
    process.exit(0);
}

migrateModels().catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
