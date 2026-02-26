import { initializeApp } from "firebase/app";
import {
    getFirestore,
    collection,
    getDocs,
    updateDoc,
    doc,
    connectFirestoreEmulator
} from "firebase/firestore";

// The project ID from firebase.json
const PROJECT_ID = "singularity-os-21d79";

const firebaseConfig = {
    apiKey: "fakety-fake-key",
    projectId: PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// FORCE EMULATOR CONNECTION
connectFirestoreEmulator(db, '127.0.0.1', 8085);

async function forceMigrate() {
    console.log(`🔄 FORCE MIGRATING EMULATOR [${PROJECT_ID}] at 127.0.0.1:8085...`);

    const agentsRef = collection(db, 'ai_agents');
    const snapshot = await getDocs(agentsRef);

    if (snapshot.empty) {
        console.log('⚠️ No agents found in the ai_agents collection.');
        process.exit(0);
    }

    console.log(`Found ${snapshot.size} total agents.`);
    let updatedCount = 0;

    for (const agentDoc of snapshot.docs) {
        const data = agentDoc.data();
        if (data.model === 'claude-sonnet-4-6') {
            console.log(`✅ Updating invalid model for agent: ${data.name}`);
            await updateDoc(doc(db, 'ai_agents', agentDoc.id), {
                model: 'claude-3-5-sonnet-20241022'
            });
            updatedCount++;
        }
    }

    console.log(`🎉 Done. Updated ${updatedCount} agents.`);
    process.exit(0);
}

forceMigrate().catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
