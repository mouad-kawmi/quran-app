import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore/lite';
import { getAuth } from 'firebase/auth';

// TODO: Replace with your actual Firebase project configuration
// You can get this from the Firebase Console (Project Settings > General > Your apps)
const firebaseConfig = {
    apiKey: "AIzaSyDCVfADOyjbPLqqWRwY4Q6TfUzVwlCMhhc",
    authDomain: "quran-bf92d.firebaseapp.com",
    projectId: "quran-bf92d",
    storageBucket: "quran-bf92d.firebasestorage.app",
    messagingSenderId: "145338500568",
    appId: "1:145338500568:web:af593dde75818d7a045ead",
    measurementId: "G-LVM3Z87R9K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
