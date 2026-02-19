import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // 1. Storage import කරන්න

const firebaseConfig = {
  apiKey: "AIzaSyDS--IQFPDA2WyBvhWhxZSrZyiWIZYjGTk",
  authDomain: "odiliya-backend-dashboard.firebaseapp.com",
  projectId: "odiliya-backend-dashboard",
  storageBucket: "odiliya-backend-dashboard.firebasestorage.app",
  messagingSenderId: "961246966912",
  appId: "1:961246966912:web:5aae24369e6c62c50de265"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// 2. Export db and storage
export const db = getFirestore(app);
export const storage = getStorage(app); // Storage එක export කළා