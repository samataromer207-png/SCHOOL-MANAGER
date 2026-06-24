import React, { useState, useEffect } from "react";
import {
  PieChart,
  Users,
  CalendarCheck,
  CreditCard,
  FileSpreadsheet,
  Settings,
  LogOut,
  Menu,
  X,
  User as UserIcon,
  Moon,
  Sun,
  ShieldCheck,
  BookOpen,
} from "lucide-react";

import { User, Student, AttendanceRecord, FeeInvoice, SchoolSettings, ViewType, Course } from "./types";
import Toast, { ToastMessage, ToastType } from "./components/Toast";
import LoginScreen from "./components/LoginScreen";
import DashboardView from "./components/DashboardView";
import StudentsView from "./components/StudentsView";
import AttendanceView from "./components/AttendanceView";
import FeesView from "./components/FeesView";
import ReportsView from "./components/ReportsView";
import SettingsView from "./components/SettingsView";

export default function App() {
  // Authentication & session variables
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("dugsiga_token"));

  // Primary business state data
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord[]>>({});
  const [fees, setFees] = useState<Record<string, FeeInvoice[]>>({});
  const [settings, setSettings] = useState<SchoolSettings>({
    schoolName: "Dugsiga Pro 2026",
    currency: "USD",
    feeAmount: 50,
    systemTheme: "light",
  });

  // UI state variables
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [appReady, setAppReady] = useState(false);

  // Inactivity timeout monitors (15 minutes limit)
  useEffect(() => {
    let timeoutId: number;
    const resetTimer = () => {
      if (!isAuthenticated) return;
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        addToast("Fadhigaadi wuu dhacay inactivity darteed (Session expired due to inactivity).", "warning");
        handleLogout();
      }, 15 * 60 * 1000);
    };

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    events.forEach((name) => window.addEventListener(name, resetTimer));
    resetTimer();

    return () => {
      window.clearTimeout(timeoutId);
      events.forEach((name) => window.removeEventListener(name, resetTimer));
    };
  }, [isAuthenticated]);

  // Handle Toast notification queue
  const addToast = (message: string, type: ToastType = "success") => {
    const id = "toast_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Safe authenticated fetch wrapper
  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    const currentToken = token || localStorage.getItem("dugsiga_token");
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
    };

    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
      // Clear session
      localStorage.removeItem("dugsiga_token");
      setToken(null);
      setIsAuthenticated(false);
      setCurrentUser(null);
      throw new Error("Lama fasaxin (Unauthorized session).");
    }
    return response;
  };

  // Bootstrapping session verifications
  useEffect(() => {
    const dTheme = settings.systemTheme || "light";
    document.documentElement.classList.toggle("dark", dTheme === "dark");
  }, [settings.systemTheme]);

  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem("dugsiga_token");
      if (storedToken) {
        try {
          const res = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            setCurrentUser(data.user);
            setIsAuthenticated(true);
            setToken(storedToken);
            addToast(`Ku soo dhawaada nidaamka, ${data.user.fullName}!`, "success");
          } else {
            localStorage.removeItem("dugsiga_token");
          }
        } catch (err) {
          console.error("Session verification failed", err);
        }
      }
      setAppReady(true);
    };
    verifySession();
  }, []);

  // Fetch business metrics once authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadAllData = async () => {
      try {
        const [studentsRes, feesRes, attendanceRes, settingsRes, coursesRes] = await Promise.all([
          authenticatedFetch("/api/students"),
          authenticatedFetch("/api/fees"),
          authenticatedFetch("/api/attendance"),
          authenticatedFetch("/api/settings"),
          authenticatedFetch("/api/courses"),
        ]);

        if (studentsRes.ok) setStudents(await studentsRes.json());
        if (feesRes.ok) setFees(await feesRes.json());
        if (attendanceRes.ok) setAttendance(await attendanceRes.json());
        if (coursesRes.ok) setCourses(await coursesRes.json());
        if (settingsRes.ok) {
          const fetchedSettings = await settingsRes.json();
          setSettings(fetchedSettings);
        }
      } catch (err) {
        console.error("Error drawing school records:", err);
        addToast("Error loading school records from backend.", "error");
      }
    };

    loadAllData();
  }, [isAuthenticated, token]);

  // Auth Functions
  const handleLogin = async (emailInput: string, passwordInput: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput, password: passwordInput }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("dugsiga_token", data.token);
        setToken(data.token);
        setCurrentUser(data.user);
        setIsAuthenticated(true);
        addToast(`Galiitaanku waa u guulaysatay! Ku soo dhawaada, ${data.user.fullName}.`, "success");
        return true;
      } else {
        const errDetails = await response.json();
        addToast(errDetails.error || "Login failed.", "error");
        return false;
      }
    } catch (err) {
      console.error(err);
      addToast("Cillad xiriir database ka (Database connection failure).", "error");
      return false;
    }
  };

  const handleSignup = async (
    usernameInput: string,
    fullNameInput: string,
    emailInput: string,
    passwordInput: string,
    roleInput: string,
    studentIdInput?: string,
    teacherClassInput?: string
  ): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: usernameInput,
          fullName: fullNameInput,
          email: emailInput,
          password: passwordInput,
          role: roleInput,
          studentId: studentIdInput,
          teacherClass: teacherClassInput,
        }),
      });

      if (response.ok) {
        addToast("Koonto cusub waa la diiwaangeliyey! Fadlan hadda gal.", "success");
        return true;
      } else {
        const errDetails = await response.json();
        addToast(errDetails.error || "Signup failed.", "error");
        return false;
      }
    } catch (err) {
      console.error(err);
      addToast("Xiriirka sign-up wuu guuldareystay.", "error");
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (err) {
      console.error(err);
    } finally {
      localStorage.removeItem("dugsiga_token");
      setToken(null);
      setIsAuthenticated(false);
      setCurrentUser(null);
      setCurrentView("dashboard");
      addToast("Awood laga baxay (Successfully logged out).", "success");
    }
  };

  // Student DB Operations
  const handleAddStudent = async (studentData: Omit<Student, "id" | "createdAt">) => {
    try {
      const res = await authenticatedFetch("/api/students", {
        method: "POST",
        body: JSON.stringify(studentData),
      });
      if (res.ok) {
        const created = await res.json();
        setStudents((prev) => [...prev, created]);
        addToast("Arday cusub waa la kordhiyey (New student successfully added)!");
      } else {
        const err = await res.json();
        addToast(err.error || "Error adding student.", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Cillad intii lagu jiray kordhinta ardayga.", "error");
    }
  };

  const handleUpdateStudent = async (id: string, updateData: Partial<Student>) => {
    try {
      const res = await authenticatedFetch(`/api/students/${id}`, {
        method: "PUT",
        body: JSON.stringify(updateData),
      });
      if (res.ok) {
        const updated = await res.json();
        setStudents((prev) => prev.map((s) => (s.id === id ? updated : s)));
        addToast("Macluumaadka ardayga waa la cusbooneysiiyay!");
      } else {
        const err = await res.json();
        addToast(err.error || "Error updating student.", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Cillad intii lagu jiray isbedelka xogta ardayga.", "error");
    }
  };

  const handleDeleteStudent = async (id: string) => {
    try {
      const res = await authenticatedFetch(`/api/students/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setStudents((prev) => prev.filter((s) => s.id !== id));
        // Reset attendance and fees associated with this id
        setFees((prev) => {
          const copied = { ...prev };
          delete copied[id];
          return copied;
        });
        setAttendance((prev) => {
          const copied = { ...prev };
          Object.keys(copied).forEach((date) => {
            copied[date] = copied[date].filter((a) => a.studentId !== id);
          });
          return copied;
        });
        addToast("Ardayga iyo xogihiisa waa la tirtiray.");
      } else {
        const err = await res.json();
        addToast(err.error || "Error deleting student.", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Cillad intii lagu jiray tirtiriidda ardayga.", "error");
    }
  };

  // Course management operations
  const handleAddCourse = async (courseData: Omit<Course, "id">) => {
    try {
      const res = await authenticatedFetch("/api/courses", {
        method: "POST",
        body: JSON.stringify(courseData),
      });
      if (res.ok) {
        const created = await res.json();
        setCourses((prev) => [...prev, created]);
        addToast("Maaddo cusub waa la kordhiyey (New course added successfully)!");
      } else {
        const err = await res.json();
        addToast(err.error || "Error adding course.", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Cillad intii lagu jiray kordhinta maaddada.", "error");
    }
  };

  const handleUpdateCourse = async (id: string, updateData: Partial<Course>) => {
    try {
      const res = await authenticatedFetch(`/api/courses/${id}`, {
        method: "PUT",
        body: JSON.stringify(updateData),
      });
      if (res.ok) {
        const updated = await res.json();
        setCourses((prev) => prev.map((c) => (c.id === id ? updated : c)));
        addToast("Maaddada waa la cusbooneysiiyay!");
      } else {
        const err = await res.json();
        addToast(err.error || "Error updating course.", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Cillad intii lagu jiray isbedelka maaddada.", "error");
    }
  };

  const handleDeleteCourse = async (id: string) => {
    try {
      const res = await authenticatedFetch(`/api/courses/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCourses((prev) => prev.filter((c) => c.id !== id));
        addToast("Maaddada waa la tirtiray.");
      } else {
        const err = await res.json();
        addToast(err.error || "Error deleting course.", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Cillad intii lagu jiray tirtiriidda maaddada.", "error");
    }
  };

  // Student grades operations
  const handleAddGrade = async (studentId: string, gradeData: { courseId: string; courseName: string; grade: string; term: string; comments?: string }) => {
    try {
      const res = await authenticatedFetch(`/api/students/${studentId}/grades`, {
        method: "POST",
        body: JSON.stringify(gradeData),
      });
      if (res.ok) {
        const created = await res.json();
        setStudents((prev) =>
          prev.map((s) => {
            if (s.id === studentId) {
              const history = s.academicHistory || [];
              return { ...s, academicHistory: [...history, created] };
            }
            return s;
          })
        );
        addToast("Dhibcaha ardayga waa la xareeyay!");
      } else {
        const err = await res.json();
        addToast(err.error || "Error adding academic record.", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Cillad xareynta dhibcaha maadada.", "error");
    }
  };

  const handleDeleteGrade = async (studentId: string, gradeId: string) => {
    try {
      const res = await authenticatedFetch(`/api/students/${studentId}/grades/${gradeId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setStudents((prev) =>
          prev.map((s) => {
            if (s.id === studentId) {
              const history = s.academicHistory || [];
              return {
                ...s,
                academicHistory: history.filter((g) => g.id !== gradeId),
              };
            }
            return s;
          })
        );
        addToast("Xogta dhibcaha waa la tirtiray.");
      } else {
        const err = await res.json();
        addToast(err.error || "Error deleting academic record.", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Cillad tirtiraha dhibcaha maadada.", "error");
    }
  };

  // Attendance Records Save
  const handleSaveAttendance = async (date: string, records: Array<{ studentId: string; status: string }>) => {
    try {
      const res = await authenticatedFetch("/api/attendance/batch", {
        method: "POST",
        body: JSON.stringify({ date, records }),
      });
      if (res.ok) {
        // Sync state
        const timestamp = new Date().toISOString();
        const formattedRecords: AttendanceRecord[] = records.map((r) => ({
          studentId: r.studentId,
          status: r.status as any,
          timestamp,
        }));
        setAttendance((prev) => ({
          ...prev,
          [date]: formattedRecords,
        }));
        addToast(`Goobjoogga taariikhda ${date} waa la kaydiyey!`);
      } else {
        const err = await res.json();
        addToast(err.error || "Error saving attendance.", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Cillad badbaadinta goobjoogga.", "error");
    }
  };

  const fetchAttendanceForDate = async (date: string): Promise<AttendanceRecord[]> => {
    try {
      const res = await authenticatedFetch(`/api/attendance?date=${date}`);
      if (res.ok) {
        return await res.json();
      }
      return [];
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  // Fees Records Operations
  const handleAddFee = async (
    studentId: string,
    feeData: Omit<FeeInvoice, "id" | "createdAt" | "updatedAt" | "history">
  ) => {
    try {
      const res = await authenticatedFetch("/api/fees", {
        method: "POST",
        body: JSON.stringify({ studentId, ...feeData }),
      });
      if (res.ok) {
        const created = await res.json();
        setFees((prev) => {
          const list = prev[studentId] || [];
          return {
            ...prev,
            [studentId]: [...list, created],
          };
        });
        addToast("Billka cusub ee rasiidka waa la xareeyay!");
      } else {
        const err = await res.json();
        addToast(err.error || "Error adding invoice.", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Cillad xareynta khidmadda biyaha/fiiska.");
    }
  };

  const handleUpdateFee = async (
    studentId: string,
    feeId: string,
    updateData: Partial<FeeInvoice> & { actionDesc?: string }
  ) => {
    try {
      const res = await authenticatedFetch(`/api/fees/${feeId}`, {
        method: "PUT",
        body: JSON.stringify({ studentId, ...updateData }),
      });
      if (res.ok) {
        const updated = await res.json();
        setFees((prev) => {
          const list = prev[studentId] || [];
          return {
            ...prev,
            [studentId]: list.map((f) => (f.id === feeId ? updated : f)),
          };
        });
        addToast("Isbedelka billka xisaabta waa la diiwaangeliyey.");
      } else {
        const err = await res.json();
        addToast(err.error || "Error updating invoice.", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Cillad bixinta biilka.");
    }
  };

  const handleDeleteFee = async (studentId: string, feeId: string) => {
    try {
      const res = await authenticatedFetch(`/api/fees/${feeId}?studentId=${studentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setFees((prev) => {
          const list = prev[studentId] || [];
          return {
            ...prev,
            [studentId]: list.filter((f) => f.id !== feeId),
          };
        });
        addToast("Billka/Invoice-ka xisaabta waa la tirtiray.");
      } else {
        const err = await res.json();
        addToast(err.error || "Error deleting invoice.", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Cillad tirtirida biilka.");
    }
  };

  // School Settings Modify
  const handleUpdateSettings = async (newSettings: Partial<SchoolSettings>) => {
    try {
      const res = await authenticatedFetch("/api/settings", {
        method: "POST",
        body: JSON.stringify(newSettings),
      });
      if (res.ok) {
        const updated = await res.json();
        setSettings(updated);
        addToast("Dejinta guud ee nidaamka waa la cusbooneysiiyay!");
      } else {
        const err = await res.json();
        addToast(err.error || "Error updating settings.", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Cillad badbaadinta dejinta.", "error");
    }
  };

  // Guarded Wipe Operations
  const handleFactoryReset = async () => {
    try {
      const res = await authenticatedFetch("/api/reset", {
        method: "POST",
      });
      if (res.ok) {
        addToast("Nadiifinta xogta waa lagu guulaystay! Dhisida mar kale.", "success");
        setStudents([]);
        setAttendance({});
        setFees({});
        setSettings({
          schoolName: "Dugsiga Pro 2026",
          currency: "USD",
          feeAmount: 50,
          systemTheme: "light",
        });
        setCurrentView("dashboard");
      } else {
        addToast("Factory reset was unsuccessful.", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Cillad intii lagu jiray wehelinta nadiifinta.", "error");
    }
  };

  // If application state verification isn't ready
  if (!appReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-550 dark:bg-slate-900 text-indigo-600 space-y-4">
        <span className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest animate-pulse">
          Dugsiga Manager 2026 loading...
        </p>
      </div>
    );
  }

  // Swap Screen to Credential panels if they aren't authenticated yet
  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} onSignup={handleSignup} />;
  }

  // Sidebar Layout Navigation Link Definitions
  const navigationLinks = [
    { view: "dashboard", label: "Dashboard", sub: "Analytics", icon: <PieChart className="w-5 h-5" /> },
    { view: "students", label: "Students", sub: "Profiles", icon: <Users className="w-5 h-5" /> },
    { view: "attendance", label: "Attendance", sub: "Rollcall", icon: <CalendarCheck className="w-5 h-5" /> },
    { view: "fees", label: "Fees & Finance", sub: "Ledger", icon: <CreditCard className="w-5 h-5" /> },
    { view: "reports", label: "Reports & Analytics", sub: "Exporters", icon: <FileSpreadsheet className="w-5 h-5" /> },
  ] as const;

  return (
    <div className={`min-h-screen flex bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300 md:pl-[280px]`}>
      
      {/* Toast Alert Queue Popups */}
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Aside Nav Toolbar (Sidebar Drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[280px] bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 ${
          mobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand header badge */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400">
              <BookOpenIcon className="w-8 h-8 font-extrabold stroke-[2.5]" />
              <span className="text-xl font-extrabold tracking-tight font-heading">Dugsiga 26</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1.5 bg-slate-50 dark:bg-slate-800 text-gray-500 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation link listings */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
            {navigationLinks.map((link) => {
              const active = currentView === link.view;
              return (
                <button
                  key={link.view}
                  onClick={() => {
                    setCurrentView(link.view);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl font-semibold text-sm transition-all relative ${
                    active
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/15"
                      : "text-gray-500 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <span className={`shrink-0 ${active ? "text-white" : "text-gray-400"}`}>
                    {link.icon}
                  </span>
                  <div className="text-left">
                    <div className="leading-tight">{link.label}</div>
                    <div className={`text-[9px] font-bold uppercase tracking-wider ${active ? "text-white/60" : "text-gray-400"}`}>
                      {link.sub}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Settings & User Profiles bottom block (Aside footer) */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-1 shrink-0 bg-slate-50/50 dark:bg-slate-900">
            <button
              onClick={() => {
                setCurrentView("settings");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-colors ${
                currentView === "settings"
                  ? "bg-slate-200 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400"
                  : "text-gray-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings (Dejinta)</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container Wrapper (Header & Central Content Canvas) */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Dynamic Nav Header Topbar */}
        <header className="h-16 border-b border-slate-100 dark:border-slate-850 bg-white/75 dark:bg-slate-900/75 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6 shrink-0 transition-colors">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-500 hover:text-gray-850 dark:text-gray-300 rounded-xl transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Quick school name title info */}
            <span className="text-sm font-extrabold text-indigo-650 dark:text-indigo-400 font-heading select-none border border-indigo-600/10 px-3 py-1 rounded-xl bg-indigo-500/5 uppercase tracking-wide">
              {settings.schoolName}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/40 font-black px-2 py-0.5 rounded-lg select-none">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>PROD</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Dark theme instant toggle shortcut */}
            <button
              onClick={() => {
                const toggledTheme = settings.systemTheme === "dark" ? "light" : "dark";
                handleUpdateSettings({ systemTheme: toggledTheme });
              }}
              className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-xl transition-colors"
              title="Toggle Theme"
            >
              {settings.systemTheme === "dark" ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {/* Profile trigger stats */}
            <div className="flex items-center gap-3 border-l border-slate-100 dark:border-slate-800 pl-4 select-none">
              <div className="text-right hidden xl:block">
                <div className="text-xs font-bold text-gray-900 dark:text-white leading-none">
                  {currentUser?.fullName}
                </div>
                <div className="text-[9px] font-black tracking-wider text-slate-400 uppercase mt-0.5">
                  {currentUser?.role || "Super Admin"}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-gray-400 hover:text-rose-600 rounded-xl transition-colors"
                title="Sii Bax (Sign Out)"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </header>

        {/* Central Content Area Canvas */}
        <main className="flex-1 p-6 lg:p-10 max-w-7xl w-full mx-auto overflow-y-auto">
          {(() => {
            switch (currentView) {
              case "dashboard":
                return (
                  <DashboardView
                    students={students}
                    fees={fees}
                    settings={settings}
                    attendance={attendance}
                  />
                );
              case "students":
                return (
                  <StudentsView
                    students={students}
                    currentUser={currentUser}
                    courses={courses}
                    onAddStudent={handleAddStudent}
                    onUpdateStudent={handleUpdateStudent}
                    onDeleteStudent={handleDeleteStudent}
                    onAddGrade={handleAddGrade}
                    onDeleteGrade={handleDeleteGrade}
                  />
                );
              case "attendance":
                return (
                  <AttendanceView
                    students={students}
                    onSaveAttendance={handleSaveAttendance}
                    fetchAttendanceForDate={fetchAttendanceForDate}
                  />
                );
              case "fees":
                return (
                  <FeesView
                    students={students}
                    fees={fees}
                    settings={settings}
                    onAddFee={handleAddFee}
                    onUpdateFee={handleUpdateFee}
                    onDeleteFee={handleDeleteFee}
                  />
                );
              case "reports":
                return (
                  <ReportsView
                    students={students}
                    fees={fees}
                    attendance={attendance}
                  />
                );
              case "settings":
                return (
                  <SettingsView
                    settings={settings}
                    onUpdateSettings={handleUpdateSettings}
                    onFactoryReset={handleFactoryReset}
                    currentUser={currentUser}
                    authenticatedFetch={authenticatedFetch}
                  />
                );
              default:
                return null;
            }
          })()}
        </main>
      </div>
    </div>
  );
}

// Brand helper component
function BookOpenIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
