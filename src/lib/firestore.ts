import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, doc, getDocs, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import fs from "fs";
import path from "path";

// Parse Firebase configuration keys
const configPath = path.join(process.cwd(), "firebase-applet-config.json");
if (!fs.existsSync(configPath)) {
  throw new Error("Unable to locate firebase-applet-config.json configuration parameters");
}

let firebaseConfig: any;
try {
  firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
} catch (err) {
  console.error("Failed to parse firebase-applet-config.json database descriptors", err);
  throw err;
}

// Initialize client Firebase app
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  console.log("[Firebase Client] Successfully initialized Project ID:", firebaseConfig.projectId);
} else {
  app = getApp();
}

// Get the customized Database instance
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

let isFirestoreAccessible = true;

export function checkFirestoreStatus(): boolean {
  return isFirestoreAccessible;
}

/**
 * Validates connection
 */
export async function testConnection() {
  try {
    const testDocRef = doc(db, "system", "connectionTest");
    await setDoc(testDocRef, { 
      testedAt: new Date().toISOString(),
      environment: "production-client-node"
    });
    const snap = await getDoc(testDocRef);
    isFirestoreAccessible = true;
    console.log("[Firebase] Connection check passed! Firestore verified path:", snap.ref.path);
  } catch (error: any) {
    console.error("[Firebase Error] Connection check failed! Details:", error?.message || error, error);
  }
}

// Run basic test check
testConnection();

/**
 * Recursively removes all undefined properties from an object so Firestore operations can succeed.
 */
export function sanitizeData<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeData(item)) as any;
  }
  if (typeof obj === "object") {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      const val = (obj as any)[key];
      if (val !== undefined) {
        cleaned[key] = sanitizeData(val);
      }
    }
    return cleaned;
  }
  return obj;
}

// --- 1. User Management Operations ---
export async function fetchUsers(): Promise<any[]> {
  try {
    const snapshot = await getDocs(collection(db, "users"));
    const list: any[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data());
    });
    isFirestoreAccessible = true;
    return list;
  } catch (err: any) {
    console.error("[Firebase Error] fetchUsers failed. Message:", err?.message || err, err);
    return [];
  }
}

export async function saveUser(user: any): Promise<void> {
  try {
    await setDoc(doc(db, "users", user.id), sanitizeData(user));
    isFirestoreAccessible = true;
  } catch (err: any) {
    console.error(`[Firebase Error] Save user failed for ID: ${user?.id}. Message:`, err?.message || err, err);
  }
}

export async function deleteUser(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "users", id));
    isFirestoreAccessible = true;
  } catch (err: any) {
    console.error(`[Firebase Error] Delete user failed for ID: ${id}. Message:`, err?.message || err, err);
  }
}

// --- 2. Session and Security Tokens ---
export async function fetchTokens(): Promise<Record<string, { userId: string; expiresAt: string }>> {
  try {
    const snapshot = await getDocs(collection(db, "tokens"));
    const tokens: Record<string, { userId: string; expiresAt: string }> = {};
    snapshot.forEach((doc) => {
      const data = doc.data();
      tokens[doc.id] = {
        userId: data.userId,
        expiresAt: data.expiresAt,
      };
    });
    isFirestoreAccessible = true;
    return tokens;
  } catch (err: any) {
    console.error("[Firebase Error] fetchTokens failed. Message:", err?.message || err, err);
    return {};
  }
}

export async function saveToken(token: string, session: { userId: string; expiresAt: string }): Promise<void> {
  try {
    await setDoc(doc(db, "tokens", token), sanitizeData(session));
    isFirestoreAccessible = true;
  } catch (err: any) {
    console.error(`[Firebase Error] Save token failed. Message:`, err?.message || err, err);
  }
}

export async function deleteToken(token: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "tokens", token));
    isFirestoreAccessible = true;
  } catch (err: any) {
    console.error(`[Firebase Error] Delete token failed. Message:`, err?.message || err, err);
  }
}

// --- 3. Student Profile Operations ---
export async function fetchStudents(): Promise<any[]> {
  try {
    const snapshot = await getDocs(collection(db, "students"));
    const list: any[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data());
    });
    isFirestoreAccessible = true;
    return list;
  } catch (err: any) {
    console.error("[Firebase Error] fetchStudents failed. Message:", err?.message || err, err);
    return [];
  }
}

export async function saveStudent(student: any): Promise<void> {
  try {
    await setDoc(doc(db, "students", student.id), sanitizeData(student));
    isFirestoreAccessible = true;
  } catch (err: any) {
    console.error(`[Firebase Error] Save student failed for ID: ${student?.id}. Message:`, err?.message || err, err);
  }
}

export async function deleteStudent(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "students", id));
    isFirestoreAccessible = true;
  } catch (err: any) {
    console.error(`[Firebase Error] Delete student failed for ID: ${id}. Message:`, err?.message || err, err);
  }
}

// --- 4. Daily Attendance Logging ---
export async function fetchAttendance(): Promise<Record<string, any[]>> {
  try {
    const snapshot = await getDocs(collection(db, "attendance"));
    const record: Record<string, any[]> = {};
    snapshot.forEach((doc) => {
      record[doc.id] = doc.data().records || [];
    });
    isFirestoreAccessible = true;
    return record;
  } catch (err: any) {
    console.error("[Firebase Error] fetchAttendance failed. Message:", err?.message || err, err);
    return {};
  }
}

export async function saveAttendance(date: string, records: any[]): Promise<void> {
  try {
    await setDoc(doc(db, "attendance", date), sanitizeData({ records }));
    isFirestoreAccessible = true;
  } catch (err: any) {
    console.error(`[Firebase Error] Save attendance failed for date: ${date}. Message:`, err?.message || err, err);
  }
}

export async function deleteAttendanceForStudent(studentId: string): Promise<void> {
  try {
    const snapshot = await getDocs(collection(db, "attendance"));
    for (const d of snapshot.docs) {
      const data = d.data();
      const records = data.records || [];
      const filtered = records.filter((r: any) => r.studentId !== studentId);
      if (filtered.length !== records.length) {
        await setDoc(doc(db, "attendance", d.id), sanitizeData({ records: filtered }));
      }
    }
    isFirestoreAccessible = true;
  } catch (err: any) {
    console.error(`[Firebase Error] Delete attendance logs failed for student ID: ${studentId}. Message:`, err?.message || err, err);
  }
}

// --- 5. Financial Ledger / Invoicing ---
export async function fetchFees(): Promise<Record<string, any[]>> {
  try {
    const snapshot = await getDocs(collection(db, "fees"));
    const record: Record<string, any[]> = {};
    snapshot.forEach((doc) => {
      record[doc.id] = doc.data().invoices || [];
    });
    isFirestoreAccessible = true;
    return record;
  } catch (err: any) {
    console.error("[Firebase Error] fetchFees failed. Message:", err?.message || err, err);
    return {};
  }
}

export async function saveFee(studentId: string, invoices: any[]): Promise<void> {
  try {
    await setDoc(doc(db, "fees", studentId), sanitizeData({ invoices }));
    isFirestoreAccessible = true;
  } catch (err: any) {
    console.error(`[Firebase Error] Save fee failed for student ID: ${studentId}. Message:`, err?.message || err, err);
  }
}

export async function deleteFeesForStudent(studentId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "fees", studentId));
    isFirestoreAccessible = true;
  } catch (err: any) {
    console.error(`[Firebase Error] Delete fees failed for student ID: ${studentId}. Message:`, err?.message || err, err);
  }
}

// --- 6. School Configurations ---
export async function fetchSettings(): Promise<any> {
  try {
    const docRef = doc(db, "settings", "config");
    const docSnap = await getDoc(docRef);
    isFirestoreAccessible = true;
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (err: any) {
    console.error("[Firebase Error] fetchSettings failed. Message:", err?.message || err, err);
    return null;
  }
}

export async function saveSettings(settings: any): Promise<void> {
  try {
    await setDoc(doc(db, "settings", "config"), sanitizeData(settings));
    isFirestoreAccessible = true;
  } catch (err: any) {
    console.error(`[Firebase Error] Save settings failed. Message:`, err?.message || err, err);
  }
}

// --- 7. Factory Audit Operations ---
export async function resetAllData(): Promise<void> {
  try {
    // 1. Reset students
    const studentsSnap = await getDocs(collection(db, "students"));
    for (const d of studentsSnap.docs) {
      await deleteDoc(d.ref);
    }
    // 2. Reset attendance
    const attendanceSnap = await getDocs(collection(db, "attendance"));
    for (const d of attendanceSnap.docs) {
      await deleteDoc(d.ref);
    }
    // 3. Reset fees
    const feesSnap = await getDocs(collection(db, "fees"));
    for (const d of feesSnap.docs) {
      await deleteDoc(d.ref);
    }
    // 4. Reset config settings
    await deleteDoc(doc(db, "settings", "config"));
    isFirestoreAccessible = true;
  } catch (err: any) {
    console.error(`[Firebase Error] Reset all data failed. Message:`, err?.message || err, err);
  }
}
