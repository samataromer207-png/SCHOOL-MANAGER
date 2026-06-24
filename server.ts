import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import { 
  fetchUsers, saveUser, deleteUser,
  fetchTokens, saveToken, deleteToken,
  fetchStudents, saveStudent, deleteStudent,
  fetchAttendance, saveAttendance, deleteAttendanceForStudent,
  fetchFees, saveFee, deleteFeesForStudent,
  fetchSettings, saveSettings, resetAllData
} from "./src/lib/firestore.js";

// Supabase Connection Settings
const SUPABASE_URL = process.env.SUPABASE_URL || "https://kxlybfypafsdsntbsrpd.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_J1mWVQUjNp8TPC00Ywf0_Q_R1XdBpwZ";

console.log("[Supabase] Connecting to project ID: kxlybfypafsdsntbsrpd");
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// @ts-ignore
const resolvedFilename = typeof import.meta?.url === "string" ? fileURLToPath(import.meta.url) : (typeof __filename !== "undefined" ? __filename : "");
// @ts-ignore
const resolvedDirname = typeof import.meta?.url === "string" ? path.dirname(resolvedFilename) : (typeof __dirname !== "undefined" ? __dirname : "");

const __filename = resolvedFilename;
const __dirname = resolvedDirname;

const app = express();
const PORT = 3000;

app.use(express.json());

// Path to low-overhead database file (kept purely for migration checks on launch)
const DB_FILE = path.join(process.cwd(), "data", "db.json");

// Initial Database Schema / Defaults
interface Database {
  users: Array<{
    id: string;
    username: string;
    fullName: string;
    email: string;
    passwordHash: string;
    salt: string;
    role: "Admin" | "Teacher" | "Student";
    studentId?: string;
    teacherClass?: string;
  }>;
  tokens: Record<string, {
    userId: string;
    expiresAt: string;
  }>;
  students: Array<{
    id: string;
    fullName: string;
    class: string;
    gender: string;
    guardianPhone: string;
    status: "active" | "inactive";
    createdAt: string;
    dateOfBirth?: string;
    address?: string;
    email?: string;
    phone?: string;
    academicHistory?: Array<{
      id: string;
      courseId: string;
      courseName: string;
      grade: string;
      term: string;
      comments?: string;
      teacherId?: string;
      teacherName?: string;
      date: string;
    }>;
  }>;
  courses: Array<{
    id: string;
    name: string;
    code: string;
    teacherId?: string;
    teacherName?: string;
    description?: string;
  }>;
  attendance: Record<string, Array<{
    studentId: string;
    status: "Present" | "Absent" | "Late" | "Excused";
    timestamp: string;
  }>>;
  fees: Record<string, Array<{
    id: string;
    month: string;
    year: number;
    amount: number;
    paidAmount: number;
    status: "paid" | "partial" | "unpaid";
    createdAt: string;
    updatedAt: string;
    history: Array<{
      action: string;
      amount: number;
      date: string;
    }>;
  }>>;
  settings: {
    schoolName: string;
    currency: string;
    feeAmount: number;
    systemTheme: "light" | "dark";
  };
}

const defaultDb: Database = {
  users: [],
  tokens: {},
  students: [],
  courses: [],
  attendance: {},
  fees: {},
  settings: {
    schoolName: "Dugsiga Pro 2026",
    currency: "USD",
    feeAmount: 50,
    systemTheme: "light"
  }
};

function readLocalDb(): Database {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf8");
      return JSON.parse(raw) as Database;
    }
  } catch (err) {
    console.error("Error reading local db file fallback:", err);
  }
  return defaultDb;
}

function writeLocalDb(data: Database): void {
  try {
    const dataDir = path.dirname(DB_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
    console.log("[Local Storage] Database state successfully backed up to db.json");
  } catch (err) {
    console.error("Error writing local db file fallback:", err);
  }
}

// Global Firebase & Supabase Configuration
const USE_FIREBASE = false; 
const USE_SUPABASE = true;

// Helper to sync individual tables in Supabase for standard relational visibility
async function syncIndividualTables(data: Database) {
  try {
    // 1. Sync Users
    if (data.users && data.users.length > 0) {
      const formattedUsers = data.users.map(u => ({
        id: u.id,
        username: u.username,
        full_name: u.fullName,
        email: u.email,
        password_hash: u.passwordHash,
        salt: u.salt,
        role: u.role,
        student_id: u.studentId || null,
        teacher_class: u.teacherClass || null,
        updated_at: new Date().toISOString()
      }));
      const { error } = await supabase.from("users").upsert(formattedUsers);
      if (error) console.log("[Supabase Relational Sync Info] Users upsert skipped/failed:", error.message);
    }

    // 2. Sync Students
    if (data.students && data.students.length > 0) {
      const formattedStudents = data.students.map(s => ({
        id: s.id,
        full_name: s.fullName,
        class: s.class,
        gender: s.gender,
        guardian_phone: s.guardianPhone,
        status: s.status,
        created_at: s.createdAt,
        date_of_birth: s.dateOfBirth || null,
        address: s.address || null,
        email: s.email || null,
        phone: s.phone || null,
        academic_history: s.academicHistory || [],
        updated_at: new Date().toISOString()
      }));
      const { error } = await supabase.from("students").upsert(formattedStudents);
      if (error) console.log("[Supabase Relational Sync Info] Students upsert skipped/failed:", error.message);
    }

    // 3. Sync Attendance
    if (data.attendance) {
      const formattedAttendance: any[] = [];
      for (const [date, records] of Object.entries(data.attendance)) {
        if (Array.isArray(records)) {
          for (const record of records) {
            formattedAttendance.push({
              id: `${date}_${record.studentId}`,
              date: date,
              student_id: record.studentId,
              status: record.status,
              timestamp: record.timestamp,
              updated_at: new Date().toISOString()
            });
          }
        }
      }
      if (formattedAttendance.length > 0) {
        const { error } = await supabase.from("attendance").upsert(formattedAttendance);
        if (error) console.log("[Supabase Relational Sync Info] Attendance upsert skipped/failed:", error.message);
      }
    }

    // 4. Sync Fees
    if (data.fees) {
      const formattedFees: any[] = [];
      for (const [studentId, invoices] of Object.entries(data.fees)) {
        if (Array.isArray(invoices)) {
          for (const inv of invoices) {
            formattedFees.push({
              id: inv.id,
              student_id: studentId,
              month: inv.month,
              year: inv.year,
              amount: inv.amount,
              paid_amount: inv.paidAmount,
              status: inv.status,
              history: inv.history || [],
              created_at: inv.createdAt,
              updated_at: inv.updatedAt || new Date().toISOString()
            });
          }
        }
      }
      if (formattedFees.length > 0) {
        const { error } = await supabase.from("fees").upsert(formattedFees);
        if (error) console.log("[Supabase Relational Sync Info] Fees upsert skipped/failed:", error.message);
      }
    }

    // 5. Sync Settings
    if (data.settings) {
      const { error } = await supabase.from("settings").upsert({
        id: "config",
        school_name: data.settings.schoolName,
        currency: data.settings.currency,
        fee_amount: data.settings.feeAmount,
        system_theme: data.settings.systemTheme,
        updated_at: new Date().toISOString()
      });
      if (error) console.log("[Supabase Relational Sync Info] Settings upsert skipped/failed:", error.message);
    }
  } catch (err: any) {
    console.log("[Supabase Relational Sync Info] Relational synchronization skipped:", err.message || err);
  }
}

// Database read/write helpers backed by Cloud Supabase
async function readDb(): Promise<Database> {
  const localDb = readLocalDb();

  if (!USE_SUPABASE) {
    return localDb;
  }

  try {
    console.log("[Supabase] Fetching school_data from Supabase...");
    const { data, error } = await supabase
      .from("school_data")
      .select("content")
      .eq("id", 1)
      .single();

    if (error) {
      console.log("[Supabase Info] Could not load from 'school_data' table (it may not exist yet, or is empty). Error:", error.message);
      // Auto-bootstrap Supabase if possible
      try {
        console.log("[Supabase Info] Bootstrapping 'school_data' table with current local db...");
        await supabase.from("school_data").upsert({ id: 1, content: localDb, updated_at: new Date().toISOString() });
      } catch (err2) {
        console.error("[Supabase Bootstrapping Info] Skipping automatic bootstrap:", err2);
      }
      return localDb;
    }

    if (data && data.content) {
      console.log("[Supabase] Successfully loaded database state from 'school_data' table.");
      const mergedDb = {
        ...defaultDb,
        ...data.content,
      };
      // Keep local in sync
      writeLocalDb(mergedDb);
      return mergedDb;
    }
  } catch (err: any) {
    console.error("[Supabase Read Error] Sourcing from local database. Error:", err.message || err);
  }

  return localDb;
}

async function writeDb(data: Database): Promise<void> {
  // Always persist local first, so it is fast, instant and 100% reliable
  writeLocalDb(data);

  if (!USE_SUPABASE) {
    return;
  }

  try {
    console.log("[Supabase] Saving school_data unified state to Supabase...");
    const { error: syncError } = await supabase
      .from("school_data")
      .upsert({ id: 1, content: data, updated_at: new Date().toISOString() });

    if (syncError) {
      console.log("[Supabase Unified Sync Error] Could not write to school_data:", syncError.message);
    } else {
      console.log("[Supabase Unified Sync] Successfully updated school_data in Supabase!");
    }

    // Best-effort relational sync of individual tables
    syncIndividualTables(data).catch(err => {
      console.log("[Supabase Relational Sync Info] skipped:", err);
    });

  } catch (err: any) {
    console.error("[Supabase Write Error] Sync failed:", err.message || err);
  }
}

// Seeding function: Migrates local SQLite metadata or low-overhead JSON to Cloud Database on startup
async function seedFromLocalDbIfNeeded() {
  if (!USE_SUPABASE) {
    return;
  }

  try {
    if (!fs.existsSync(DB_FILE)) return;
    
    // Check if Supabase already holds users documentation
    const db = await readDb();
    if (db.users && db.users.length > 0) {
      console.log("[Migration] Supabase already contains records. Skipping local seeding.");
      return;
    }
    
    console.log("[Migration] Supabase database is completely blank! Initiating local db migration...");
    const raw = fs.readFileSync(DB_FILE, "utf8");
    const data = JSON.parse(raw) as Database;
    
    await writeDb(data);
    console.log("[Migration] Local schema db.json successfully copied to Supabase database!");
  } catch (err) {
    console.error("[Migration] Alert: Seeding pipeline experienced warnings:", err);
  }
}

// Password cryptography helpers
function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
}

// Authentication Middleware
interface AuthenticatedRequest extends express.Request {
  user?: {
    id: string;
    username: string;
    fullName: string;
    email: string;
    role: "Admin" | "Teacher" | "Student";
    studentId?: string;
    teacherClass?: string;
  };
}

async function authenticateToken(
  req: AuthenticatedRequest,
  res: express.Response,
  next: express.NextFunction
) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Lama helin fariinta fasaxa (Authentication token is missing)." });
    return;
  }

  const db = await readDb();
  const session = db.tokens[token];

  if (!session) {
    res.status(401).json({ error: "Fariin fasax oo khaldan ama dhacday (Invalid or expired token)." });
    return;
  }

  // Check expiration
  if (new Date(session.expiresAt) < new Date()) {
    // Cleanup expired token locally
    delete db.tokens[token];
    await writeDb(db);
    
    if (USE_FIREBASE) {
      await deleteToken(token);
    }
    res.status(401).json({ error: "Xilligii fasaxa waa uu dhacay (Token has expired)." });
    return;
  }

  const user = db.users.find(u => u.id === session.userId);
  if (!user) {
    res.status(401).json({ error: "Isticmaalaha lama helin (User not found)." });
    return;
  }

  req.user = {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    role: user.role || "Admin",
    studentId: user.studentId,
    teacherClass: user.teacherClass
  };

  next();
}

// Helper middleware for role protection
function requireRoles(roles: Array<"Admin" | "Teacher" | "Student">) {
  return (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Lada fasaxay (Unauthorized session)." });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: `Ficilkan wuxuu u gaar yahay: ${roles.join(", ")} (Forbidden for role ${req.user.role}).` });
      return;
    }
    next();
  };
}

// ---------------------- API ROUTES ----------------------

// 1. Auth Routing: Signup
app.post("/api/auth/signup", async (req, res) => {
  const { username, fullName, email, password, role, studentId, teacherClass } = req.body;

  if (!username || !fullName || !email || !password) {
    res.status(400).json({ error: "Fadlan buuxi dhammaan meelaha banaan (Please fill in all fields)." });
    return;
  }

  const db = await readDb();

  // Validate duplicate user
  const exists = db.users.some(u => 
    (u.username || "").toLowerCase() === username.toLowerCase() || 
    (u.email || "").toLowerCase() === email.toLowerCase()
  );
  if (exists) {
    res.status(400).json({ error: "Magacan ama iimaylkan waa la isticmaalay (Username or Email already registered)." });
    return;
  }

  const id = crypto.randomUUID();
  const salt = generateSalt();
  const passwordHash = hashPassword(password, salt);

  db.users.push({
    id,
    username,
    fullName,
    email,
    passwordHash,
    salt,
    role: (role || "Admin") as "Admin" | "Teacher" | "Student",
    studentId: studentId || undefined,
    teacherClass: teacherClass || undefined,
  });

  await writeDb(db);
  res.status(201).json({ success: true, message: "Diiwaangalintu waa u guulaysatay (Signup successful)!" });
});

// 2. Auth Routing: Login
app.post("/api/auth/login", async (req, res) => {
  const { email, username, password } = req.body;
  const loginEmail = email || username; // Allow fallback if client passes username parameter

  console.log(`[Login Attempt] Email/Username: "${loginEmail}"`);

  if (!loginEmail || !password) {
    res.status(400).json({ error: "Fadlan geli iimaylkaaga iyo sirtaada (Please input email and password)." });
    return;
  }

  const db = await readDb();
  
  // Log registered users emails in database for debugging
  const registeredEmails = db.users.map(u => u.email);
  console.log(`[Login Attempt] Registered user emails in DB:`, registeredEmails);

  // Find by email address or username (Iimayl ama Username halgu galo)
  const user = db.users.find(u => 
    (u.email && u.email.toLowerCase() === loginEmail.trim().toLowerCase()) ||
    (u.username && u.username.toLowerCase() === loginEmail.trim().toLowerCase())
  );

  if (!user) {
    console.log(`[Login Attempt] No user found with email or username: "${loginEmail}"`);
    res.status(400).json({ error: "Iimaylka, username-ka ama sirtaadu waa khaldan tahay (Invalid email, username or password)." });
    return;
  }

  const hashed = hashPassword(password, user.salt);
  if (hashed !== user.passwordHash) {
    console.log(`[Login Attempt] Password hash mismatch for user: "${loginEmail}". Expected: "${user.passwordHash?.substring(0, 10)}...", Got: "${hashed.substring(0, 10)}..."`);
    res.status(400).json({ error: "Iimaylka ama sirtaadu waa khaldan tahay (Invalid email or password)." });
    return;
  }

  console.log(`[Login Attempt] Login successful for user: "${loginEmail}"`);

  // Generate Token
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

  db.tokens[token] = {
    userId: user.id,
    expiresAt,
  };

  await writeDb(db);

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role || "Admin",
      studentId: user.studentId,
      teacherClass: user.teacherClass
    },
  });
});

// 2.5 Auth Routing: Forgot Password / Reset Link
app.post("/api/auth/forgot-password", async (req, res) => {
  const { email, fullName, newPassword } = req.body;

  if (!email || !fullName || !newPassword) {
    res.status(400).json({ error: "Fadlan buuxi dhammaan meelaha banaan (Please fill in Email, Full Name and New Password)." });
    return;
  }

  const db = await readDb();
  // Find user by both registered email. Fallback to matching by email only to make it resilient
  let userIndex = db.users.findIndex(
    u => u.email && u.email.toLowerCase() === email.trim().toLowerCase() && 
         u.fullName && u.fullName.toLowerCase() === fullName.trim().toLowerCase()
  );

  if (userIndex === -1) {
    userIndex = db.users.findIndex(
      u => u.email && u.email.toLowerCase() === email.trim().toLowerCase()
    );
  }

  if (userIndex === -1) {
    res.status(404).json({ error: "Koontadaas lama helin. Fadlan hubi iimaylka (Account matching this email not found)." });
    return;
  }

  const user = db.users[userIndex];
  const salt = generateSalt();
  const passwordHash = hashPassword(newPassword, salt);

  user.salt = salt;
  user.passwordHash = passwordHash;

  db.users[userIndex] = user;
  await writeDb(db);

  res.json({ success: true, message: "Furaha sirta ah waa la beddelay! Fadlan hadda gal (Password successfully reset! Please login)." });
});

// 3. Auth Routing: Get Current User (Me)
app.get("/api/auth/me", authenticateToken as any, (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user });
});

// 4. Auth Routing: Logout
app.post("/api/auth/logout", async (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token) {
    const db = await readDb();
    if (db.tokens && db.tokens[token]) {
      delete db.tokens[token];
      await writeDb(db);
    }
    if (USE_FIREBASE) {
      await deleteToken(token);
    }
  }

  res.json({ success: true, message: "Awood laga baxay (Successfully logged out)" });
});

// 5. Students API (SIS Module)
app.get("/api/students", authenticateToken as any, async (req: AuthenticatedRequest, res) => {
  const db = await readDb();
  
  // If user role is Student, they can only view their own student records!
  if (req.user?.role === "Student" && req.user.studentId) {
    const selfStudent = db.students.filter(s => s.id === req.user?.studentId);
    res.json(selfStudent);
    return;
  }
  
  res.json(db.students);
});

app.post("/api/students", authenticateToken as any, requireRoles(["Admin", "Teacher"]) as any, async (req, res) => {
  const { fullName, class: className, gender, guardianPhone, status, dateOfBirth, address, email, phone } = req.body;

  if (!fullName || !className) {
    res.status(400).json({ error: "Magaca iyo fasalka waa qasab (Name and Class are required)." });
    return;
  }

  const db = await readDb();
  const newStudent = {
    id: "stud-" + crypto.randomBytes(4).toString("hex") + "-" + Date.now().toString(36),
    fullName: fullName.trim(),
    class: className.trim(),
    gender: gender || "Male",
    guardianPhone: guardianPhone ? guardianPhone.trim() : "",
    status: (status || "active") as "active" | "inactive",
    createdAt: new Date().toISOString().split("T")[0],
    dateOfBirth: dateOfBirth ? dateOfBirth.trim() : "",
    address: address ? address.trim() : "",
    email: email ? email.trim() : "",
    phone: phone ? phone.trim() : "",
    academicHistory: []
  };

  db.students.push(newStudent);
  await writeDb(db);

  res.status(201).json(newStudent);
});

app.put("/api/students/:id", authenticateToken as any, requireRoles(["Admin", "Teacher"]) as any, async (req, res) => {
  const { id } = req.params;
  const { fullName, class: className, gender, guardianPhone, status, dateOfBirth, address, email, phone } = req.body;

  const db = await readDb();
  const idx = db.students.findIndex(s => s.id === id);

  if (idx === -1) {
    res.status(404).json({ error: "Ardayga lama helin (Student not found)." });
    return;
  }

  db.students[idx] = {
    ...db.students[idx],
    fullName: fullName !== undefined ? fullName.trim() : db.students[idx].fullName,
    class: className !== undefined ? className.trim() : db.students[idx].class,
    gender: gender !== undefined ? gender : db.students[idx].gender,
    guardianPhone: guardianPhone !== undefined ? guardianPhone.trim() : db.students[idx].guardianPhone,
    status: status !== undefined ? status : db.students[idx].status,
    dateOfBirth: dateOfBirth !== undefined ? dateOfBirth.trim() : (db.students[idx].dateOfBirth || ""),
    address: address !== undefined ? address.trim() : (db.students[idx].address || ""),
    email: email !== undefined ? email.trim() : (db.students[idx].email || ""),
    phone: phone !== undefined ? phone.trim() : (db.students[idx].phone || ""),
  };

  await writeDb(db);
  res.json(db.students[idx]);
});

app.delete("/api/students/:id", authenticateToken as any, requireRoles(["Admin"]) as any, async (req, res) => {
  const { id } = req.params;

  const db = await readDb();
  db.students = db.students.filter(s => s.id !== id);
  if (db.fees && db.fees[id]) {
    delete db.fees[id];
  }
  if (db.attendance) {
    for (const date of Object.keys(db.attendance)) {
      db.attendance[date] = db.attendance[date].filter((r: any) => r.studentId !== id);
    }
  }
  await writeDb(db);

  if (USE_FIREBASE) {
    await deleteStudent(id);
    await deleteFeesForStudent(id);
    await deleteAttendanceForStudent(id);
  }

  res.json({ success: true, message: "Ardayga iyo macluumaadkiisa waa la tirtiray (Student and data deleted successfully)." });
});

// 5.1 Courses API (Retained purely for metadata/routing safety schemas)
app.get("/api/courses", authenticateToken as any, async (req, res) => {
  const db = await readDb();
  res.json(db.courses || []);
});

app.post("/api/courses", authenticateToken as any, requireRoles(["Admin"]) as any, async (req, res) => {
  const { name, code, teacherId, teacherName, description } = req.body;

  if (!name || !code) {
    res.status(400).json({ error: "Magaca iyo koodhka Maaddada waa qasab (Course Name and Code are required)." });
    return;
  }

  const db = await readDb();
  const newCourse = {
    id: "course-" + crypto.randomBytes(4).toString("hex") + "-" + Date.now().toString(36),
    name: name.trim(),
    code: code.trim().toUpperCase(),
    teacherId: teacherId || undefined,
    teacherName: teacherName || undefined,
    description: description ? description.trim() : "",
  };

  if (!db.courses) db.courses = [];
  db.courses.push(newCourse);
  await writeDb(db);

  res.status(201).json(newCourse);
});

app.put("/api/courses/:id", authenticateToken as any, requireRoles(["Admin"]) as any, async (req, res) => {
  const { id } = req.params;
  const { name, code, teacherId, teacherName, description } = req.body;

  const db = await readDb();
  if (!db.courses) db.courses = [];
  const idx = db.courses.findIndex(c => c.id === id);

  if (idx === -1) {
    res.status(404).json({ error: "Maaddada lama helin (Course not found)." });
    return;
  }

  db.courses[idx] = {
    ...db.courses[idx],
    name: name !== undefined ? name.trim() : db.courses[idx].name,
    code: code !== undefined ? code.trim().toUpperCase() : db.courses[idx].code,
    teacherId: teacherId !== undefined ? teacherId : db.courses[idx].teacherId,
    teacherName: teacherName !== undefined ? teacherName : db.courses[idx].teacherName,
    description: description !== undefined ? description.trim() : db.courses[idx].description,
  };

  await writeDb(db);
  res.json(db.courses[idx]);
});

app.delete("/api/courses/:id", authenticateToken as any, requireRoles(["Admin"]) as any, async (req, res) => {
  const { id } = req.params;
  const db = await readDb();
  if (!db.courses) db.courses = [];

  const initialCount = db.courses.length;
  db.courses = db.courses.filter(c => c.id !== id);

  if (db.courses.length === initialCount) {
    res.status(404).json({ error: "Maaddada lama helin (Course not found)." });
    return;
  }

  await writeDb(db);
  res.json({ success: true, message: "Maaddada waa la tirtiray (Course deleted successfully)." });
});

// 5.2 Grades/Academic Performance Management API
app.post("/api/students/:studentId/grades", authenticateToken as any, requireRoles(["Admin", "Teacher"]) as any, async (req: AuthenticatedRequest, res) => {
  const { studentId } = req.params;
  const { courseId, courseName, grade, term, comments } = req.body;

  if (!courseId || !courseName || !grade || !term) {
    res.status(400).json({ error: "Fadlan buuxi xogta dhibcaha maadada (Course ID, name, grade, term are required)." });
    return;
  }

  const db = await readDb();
  const student = db.students.find(s => s.id === studentId);
  if (!student) {
    res.status(404).json({ error: "Ardayga lama helin (Student not found)." });
    return;
  }

  const newRecord = {
    id: "grade-" + crypto.randomBytes(4).toString("hex") + "-" + Date.now().toString(36),
    courseId,
    courseName,
    grade,
    term,
    comments: comments || "",
    teacherId: req.user?.id,
    teacherName: req.user?.fullName,
    date: new Date().toISOString().split("T")[0]
  };

  if (!student.academicHistory) student.academicHistory = [];
  student.academicHistory.push(newRecord);
  await writeDb(db);

  res.status(201).json(newRecord);
});

app.put("/api/students/:studentId/grades/:gradeId", authenticateToken as any, requireRoles(["Admin", "Teacher"]) as any, async (req, res) => {
  const { studentId, gradeId } = req.params;
  const { grade, term, comments, courseId, courseName } = req.body;

  const db = await readDb();
  const student = db.students.find(s => s.id === studentId);
  if (!student) {
    res.status(404).json({ error: "Ardayga lama helin (Student not found)." });
    return;
  }

  if (!student.academicHistory) student.academicHistory = [];
  const idx = student.academicHistory.findIndex(g => g.id === gradeId);
  if (idx === -1) {
    res.status(404).json({ error: "Warbixinta dhibcaha lama helin (Academic record not found)." });
    return;
  }

  student.academicHistory[idx] = {
    ...student.academicHistory[idx],
    grade: grade !== undefined ? grade : student.academicHistory[idx].grade,
    term: term !== undefined ? term : student.academicHistory[idx].term,
    comments: comments !== undefined ? comments : student.academicHistory[idx].comments,
    courseId: courseId !== undefined ? courseId : student.academicHistory[idx].courseId,
    courseName: courseName !== undefined ? courseName : student.academicHistory[idx].courseName,
  };

  await writeDb(db);
  res.json(student.academicHistory[idx]);
});

app.delete("/api/students/:studentId/grades/:gradeId", authenticateToken as any, requireRoles(["Admin", "Teacher"]) as any, async (req, res) => {
  const { studentId, gradeId } = req.params;

  const db = await readDb();
  const student = db.students.find(s => s.id === studentId);
  if (!student) {
    res.status(404).json({ error: "Ardayga lama helin (Student not found)." });
    return;
  }

  if (!student.academicHistory) student.academicHistory = [];
  const initialLength = student.academicHistory.length;
  student.academicHistory = student.academicHistory.filter(g => g.id !== gradeId);

  if (student.academicHistory.length === initialLength) {
    res.status(404).json({ error: "Warbixinta dhibcaha lama helin (Academic record not found)." });
    return;
  }

  await writeDb(db);
  res.json({ success: true, message: "Warbixinta dhibcaha waa la tirtiray (Academic record deleted)." });
});

// 6. Attendance API
app.get("/api/attendance", authenticateToken as any, async (req, res) => {
  const { date } = req.query;
  const db = await readDb();

  if (date) {
    const list = db.attendance[String(date)] || [];
    res.json(list);
  } else {
    res.json(db.attendance);
  }
});

app.post("/api/attendance/batch", authenticateToken as any, async (req, res) => {
  const { date, records } = req.body; // records: [{ studentId, status }]

  if (!date || !Array.isArray(records)) {
    res.status(400).json({ error: "Fadlan bixi taariikhda iyo diiwaanka xubnaha (Date and records array are required)." });
    return;
  }

  const db = await readDb();
  const timestamp = new Date().toISOString();

  db.attendance[String(date)] = records.map(r => ({
    studentId: r.studentId,
    status: r.status as "Present" | "Absent" | "Excused",
    timestamp,
  }));

  await writeDb(db);
  res.json({ success: true, message: "Goobjoogga waa la xareeyay (Attendance saved)." });
});

// 7. Fees & Finance API
app.get("/api/fees", authenticateToken as any, async (req, res) => {
  const db = await readDb();
  res.json(db.fees);
});

app.post("/api/fees", authenticateToken as any, async (req, res) => {
  const { studentId, month, year, amount, paidAmount } = req.body;

  if (!studentId || !month || !year || amount === undefined || paidAmount === undefined) {
    res.status(400).json({ error: "Dhammaan xogaha hoose waa muhiim (All invoice details are required)." });
    return;
  }

  const db = await readDb();

  if (!db.fees[studentId]) {
    db.fees[studentId] = [];
  }

  const amt = parseFloat(amount);
  const paid = parseFloat(paidAmount);
  let status: "paid" | "partial" | "unpaid" = "unpaid";
  if (paid >= amt) status = "paid";
  else if (paid > 0) status = "partial";

  const creationTime = new Date().toISOString();
  const newInvoice = {
    id: "fee-" + crypto.randomBytes(4).toString("hex") + "-" + Date.now().toString(36),
    month,
    year: parseInt(year),
    amount: amt,
    paidAmount: paid,
    status,
    createdAt: creationTime,
    updatedAt: creationTime,
    history: [
      {
        action: "created",
        amount: paid,
        date: creationTime,
      }
    ]
  };

  db.fees[studentId].push(newInvoice);
  await writeDb(db);

  res.status(201).json({ ...newInvoice, studentId });
});

app.put("/api/fees/:id", authenticateToken as any, async (req, res) => {
  const { id } = req.params;
  const { studentId, month, year, amount, paidAmount, actionDesc } = req.body;

  if (!studentId) {
    res.status(400).json({ error: "Ardayga ID kiisu waa qasab (studentId is required)." });
    return;
  }

  const db = await readDb();
  const studentFees = db.fees[studentId] || [];
  const idx = studentFees.findIndex(f => f.id === id);

  if (idx === -1) {
    res.status(404).json({ error: "Billka/Invoice-ka lama helin (Invoice not found)." });
    return;
  }

  const currentInvoice = studentFees[idx];
  const amt = amount !== undefined ? parseFloat(amount) : currentInvoice.amount;
  const paid = paidAmount !== undefined ? parseFloat(paidAmount) : currentInvoice.paidAmount;

  let status: "paid" | "partial" | "unpaid" = "unpaid";
  if (paid >= amt) status = "paid";
  else if (paid > 0) status = "partial";

  const updatedTime = new Date().toISOString();
  const updatedInvoice = {
    ...currentInvoice,
    month: month !== undefined ? month : currentInvoice.month,
    year: year !== undefined ? parseInt(year) : currentInvoice.year,
    amount: amt,
    paidAmount: paid,
    status,
    updatedAt: updatedTime,
  };

  updatedInvoice.history.push({
    action: actionDesc || "edited",
    amount: paid,
    date: updatedTime
  });

  studentFees[idx] = updatedInvoice;
  db.fees[studentId] = studentFees;
  await writeDb(db);

  res.json({ ...updatedInvoice, studentId });
});

app.delete("/api/fees/:id", authenticateToken as any, async (req, res) => {
  const { id } = req.params;
  const { studentId } = req.query;

  if (!studentId) {
    res.status(400).json({ error: "Fadlan bixi aqoonsiyada ardayga (Student ID is required)." });
    return;
  }

  const db = await readDb();
  const studentIdStr = String(studentId);

  if (db.fees[studentIdStr]) {
    const initialLength = db.fees[studentIdStr].length;
    db.fees[studentIdStr] = db.fees[studentIdStr].filter(f => f.id !== id);
    
    if (db.fees[studentIdStr].length < initialLength) {
      await writeDb(db);
      res.json({ success: true, message: "Billka waa la tirtiray (Invoice deleted)." });
      return;
    }
  }

  res.status(404).json({ error: "Invoice-ka lama helin (Invoice not found)." });
});

// 8. Settings API
app.get("/api/settings", authenticateToken as any, async (req, res) => {
  const db = await readDb();
  res.json(db.settings);
});

app.post("/api/settings", authenticateToken as any, async (req, res) => {
  const { schoolName, currency, feeAmount, systemTheme } = req.body;
  const db = await readDb();

  db.settings = {
    schoolName: schoolName !== undefined ? String(schoolName).trim() : db.settings.schoolName,
    currency: currency !== undefined ? String(currency).trim() : db.settings.currency,
    feeAmount: feeAmount !== undefined ? parseFloat(feeAmount) : db.settings.feeAmount,
    systemTheme: systemTheme !== undefined && (systemTheme === "light" || systemTheme === "dark") ? systemTheme : db.settings.systemTheme,
  };

  await writeDb(db);
  res.json(db.settings);
});

// 8.5. Users & Roles API (Admins only)
app.get("/api/users", authenticateToken as any, requireRoles(["Admin"]) as any, async (req, res) => {
  const db = await readDb();
  const safeUsers = db.users.map(u => ({
    id: u.id,
    username: u.username,
    fullName: u.fullName,
    email: u.email,
    role: u.role,
    studentId: u.studentId,
    teacherClass: u.teacherClass
  }));
  res.json(safeUsers);
});

app.post("/api/users", authenticateToken as any, requireRoles(["Admin"]) as any, async (req, res) => {
  const { username, fullName, email, password, role, studentId, teacherClass } = req.body;

  if (!username || !fullName || !email || !password || !role) {
    res.status(400).json({ error: "Username, full name, email, password and role are required." });
    return;
  }

  const db = await readDb();

  const exists = db.users.some(u => 
    (u.username || "").toLowerCase() === username.toLowerCase() || 
    (u.email || "").toLowerCase() === email.toLowerCase()
  );
  if (exists) {
    res.status(400).json({ error: "Username or email is already registered." });
    return;
  }

  const id = crypto.randomUUID();
  const salt = generateSalt();
  const passwordHash = hashPassword(password, salt);

  const newUser = {
    id,
    username: username.toLowerCase().trim(),
    fullName: fullName.trim(),
    email: email.trim().toLowerCase(),
    passwordHash,
    salt,
    role: role as "Admin" | "Teacher" | "Student",
    studentId: studentId || undefined,
    teacherClass: teacherClass || undefined,
  };

  db.users.push(newUser);
  await writeDb(db);

  res.status(201).json({
    id: newUser.id,
    username: newUser.username,
    fullName: newUser.fullName,
    email: newUser.email,
    role: newUser.role,
    studentId: newUser.studentId,
    teacherClass: newUser.teacherClass,
  });
});

app.put("/api/users/:id", authenticateToken as any, requireRoles(["Admin"]) as any, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { fullName, email, password, role, studentId, teacherClass } = req.body;

  const db = await readDb();
  const idx = db.users.findIndex(u => u.id === id);

  if (idx === -1) {
    res.status(404).json({ error: "User not found." });
    return;
  }

  const user = db.users[idx];

  if (user.id === req.user?.id && role !== undefined && role !== "Admin") {
    res.status(400).json({ error: "You cannot demote yourself from Admin status." });
    return;
  }

  if (fullName !== undefined) user.fullName = fullName.trim();
  if (email !== undefined) user.email = email.trim().toLowerCase();
  if (role !== undefined) user.role = role as any;
  if (studentId !== undefined) user.studentId = studentId || undefined;
  if (teacherClass !== undefined) user.teacherClass = teacherClass || undefined;

  if (password) {
    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);
    user.salt = salt;
    user.passwordHash = passwordHash;
  }

  db.users[idx] = user;
  await writeDb(db);

  res.json({
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    studentId: user.studentId,
    teacherClass: user.teacherClass,
  });
});

app.delete("/api/users/:id", authenticateToken as any, requireRoles(["Admin"]) as any, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  if (id === req.user?.id) {
    res.status(400).json({ error: "You cannot delete your own logged-in admin account." });
    return;
  }

  const db = await readDb();
  db.users = db.users.filter(u => u.id !== id);
  await writeDb(db);

  if (USE_FIREBASE) {
    await deleteUser(id);
  }
  res.json({ success: true, message: "User deleted successfully." });
});

// 9. Reset API (Danger Zone)
app.post("/api/reset", authenticateToken as any, async (req: AuthenticatedRequest, res) => {
  const db = await readDb();
  db.students = [];
  db.attendance = {};
  db.fees = {};
  db.settings = defaultDb.settings;
  await writeDb(db);

  if (USE_FIREBASE) {
    await resetAllData();
  }
  res.json({ success: true, message: "Xogta dugsiga oo idil waa la nadiifiyey (All data reset except user session)." });
});


// --------------------------------------------------------

// Vite integration:
async function startServer() {
  // Migrate any existing local db.json data directly to Firestore on startup
  await seedFromLocalDbIfNeeded();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // SPA fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
