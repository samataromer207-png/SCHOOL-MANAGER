import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";
import path from "path";

const configPath = path.join(process.cwd(), "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));

const app = initializeApp(firebaseConfig, "query-app");
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  console.log("--- QUERYING FIRESTORE DATABASE ---");
  try {
    const snap = await getDocs(collection(db, "users"));
    console.log("Users count in Firestore:", snap.size);
    snap.forEach((doc) => {
      console.log("User doc:", doc.id, "=>", doc.data()?.username, doc.data()?.email, doc.data()?.fullName);
    });
  } catch (error: any) {
    console.error("Failed to query users:", error?.message || error);
  }
  console.log("--- Done, exiting now ---");
  process.exit(0);
}

run();
