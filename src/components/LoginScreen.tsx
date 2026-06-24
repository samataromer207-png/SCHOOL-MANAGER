import React, { useState } from "react";
import { BookOpen, KeyRound, User, Mail, UserPlus, LogIn, ShieldCheck, Check, ArrowLeft, HelpCircle } from "lucide-react";

interface LoginScreenProps {
  onLogin: (email: string, pass: string) => Promise<boolean>;
  onSignup: (username: string, fullName: string, email: string, pass: string, role: string, studentId?: string, teacherClass?: string) => Promise<boolean>;
}

export default function LoginScreen({ onLogin, onSignup }: LoginScreenProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  // Form states
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Admin");
  const [studentId, setStudentId] = useState("");
  const [teacherClass, setTeacherClass] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (isForgotPassword) {
      if (!email || !fullName || !password) {
        setError("Fadlan buuxi dhammaan meelaha banaan (Please fill in Email, Name and New Password).");
        return;
      }

      setLoading(true);
      try {
        const response = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), fullName: fullName.trim(), newPassword: password }),
        });

        const resData = await response.json();
        if (response.ok) {
          setSuccessMsg(resData.message || "Furaha sirta ah waa la beddelay! Gali hadda.");
          setIsForgotPassword(false);
          setPassword("");
        } else {
          setError(resData.error || "Cillad ayaa dhacday intii lagu jiray beddelka furaha.");
        }
      } catch (err: any) {
        setError(err?.message || "Cillad ayaa dhacday (An error occurred).");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (isRegister) {
      if (!username || !fullName || !email || !password) {
        setError("Fadlan buuxi dhammaan meelaha banaan (Fill in all fields).");
        return;
      }

      setLoading(true);
      try {
        const success = await onSignup(
          username.trim(),
          fullName.trim(),
          email.trim(),
          password,
          role,
          role === "Student" ? studentId.trim() : undefined,
          role === "Teacher" ? teacherClass.trim() : undefined
        );
        if (success) {
          setSuccessMsg("Diiwaangalintu waa u guulaysatay! Fadlan hadda gal (Signup successful! Please login with your Email).");
          setIsRegister(false);
          setPassword("");
        }
      } catch (err: any) {
        setError(err?.message || "Cillad ayaa dhacday (An error occurred).");
      } finally {
        setLoading(false);
      }
    } else {
      if (!email || !password) {
        setError("Fadlan buuxi iimaylkaaga iyo sirtaada (Please fill in Email and Password).");
        return;
      }

      setLoading(true);
      try {
        const success = await onLogin(email.trim(), password);
        if (!success) {
          setError("Iimaylka ama sirtaadu waa khaldan tahay (Invalid email or password).");
        }
      } catch (err: any) {
        setError(err?.message || "Cillad ayaa dhacday (An error occurred).");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 shadow-2xl p-8 rounded-3xl space-y-6">
        
        {/* Visual Brand Branding */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-indigo-650 dark:text-indigo-400">
            <BookOpen className="w-10 h-10 text-indigo-650 shrink-0" />
            <span className="text-3xl font-black tracking-tight font-heading">Dugsiga 26</span>
          </div>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
            System School Management
          </div>
        </div>

        {/* Dynamic Somali Title depending on mode */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {isForgotPassword 
              ? "Beddelka Furaha (Reset Password)" 
              : isRegister 
                ? "Is-diiwaangeli (Admin/User Sign-Up)" 
                : "Gali Koontada (Secured Access)"}
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            {isForgotPassword 
              ? "Geli iimaylkaaga iyo magacaaga si aad u dejiso fure cusub" 
              : isRegister 
                ? "Ku fur koonto cusub nidaamka maamulka" 
                : "Geli iimaylkaaga Gmail-ka iyo sirtaada si aad u bilowdo"}
          </p>
        </div>

        {/* Error / Success feedback indicators */}
        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold leading-relaxed border border-rose-100 dark:border-rose-950/50">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold leading-relaxed border border-emerald-100 dark:border-emerald-950/50 flex gap-2 items-center">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Interactive form panel */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email field (Always shown for all forms) */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Iimaylkaaga Gmail-ka (Gmail/Email Address)
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="magac@gmail.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white text-sm outline-none focus:border-indigo-500 transition-colors font-medium"
              />
            </div>
          </div>

          {/* Full Name (Shown for Register and Forgot Password) */}
          {(isRegister || isForgotPassword) && (
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Magaca oo Dhamaystiran (Full Name)
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="t.g. Macallin Axmed"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white text-sm outline-none focus:border-indigo-500 transition-colors font-medium"
                />
              </div>
            </div>
          )}

          {/* Username (Shown only for Register) */}
          {isRegister && (
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Magaca Isticmaalaha (Username)
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white text-sm outline-none focus:border-indigo-500 transition-colors font-medium"
                />
              </div>
            </div>
          )}

          {/* Role and linked fields (Shown only for Register) */}
          {isRegister && (
            <>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Doorkaaga (Your Role) *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500 transition-colors font-semibold"
                >
                  <option value="Admin">Admin (School Administrator)</option>
                  <option value="Teacher">Teacher (Classroom Instructor)</option>
                  <option value="Student">Student (Enrolled Learner)</option>
                </select>
              </div>

              {role === "Student" && (
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Geli Student ID si aad ugu xirto (Student ID or Leave Blank)
                  </label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="t.g. stud-xxxx"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white text-sm outline-none focus:border-indigo-500 transition-colors font-medium"
                  />
                </div>
              )}

              {role === "Teacher" && (
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Fasalka laguu xil-saaray (Assigned Class)
                  </label>
                  <input
                    type="text"
                    value={teacherClass}
                    onChange={(e) => setTeacherClass(e.target.value)}
                    placeholder="t.g. Form 4B"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white text-sm outline-none focus:border-indigo-500 transition-colors font-medium"
                  />
                </div>
              )}
            </>
          )}

          {/* Password (Different label for Forgot Password) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                {isForgotPassword ? "Furaha Cusub (New Password)" : "Furaha Sirta ah (Password)"}
              </label>
              {!isRegister && !isForgotPassword && (
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccessMsg(null);
                    setIsForgotPassword(true);
                  }}
                  className="text-[10px] font-bold text-indigo-650 dark:text-indigo-400 hover:underline"
                >
                  Miyaad ilowday furaha? (Forgot Password?)
                </button>
              )}
            </div>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isRegister || isForgotPassword ? "******" : "Geli furaha"}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white text-sm outline-none focus:border-indigo-500 transition-colors font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg disabled:bg-indigo-400 hover:shadow-indigo-600/25 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isForgotPassword ? (
              <>
                <KeyRound className="w-4 h-4" /> Cusbooneysii Furaha (Reset Password)
              </>
            ) : isRegister ? (
              <>
                <UserPlus className="w-4 h-4" /> Diiwaangeli Koonto (Sign Up)
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Gali Nidaamka (Sign In)
              </>
            )}
          </button>
        </form>

        {/* Bottom Toggle Controls Navigation Links */}
        <div className="text-center pt-2 space-y-2">
          {isForgotPassword ? (
            <button
              type="button"
              className="text-xs font-bold text-indigo-650 dark:text-indigo-400 hover:underline flex items-center justify-center gap-1.5 mx-auto"
              onClick={() => {
                setError(null);
                setSuccessMsg(null);
                setIsForgotPassword(false);
              }}
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Dib ugu laabo Gali Koontada (Back to Login)
            </button>
          ) : (
            <button
              type="button"
              className="text-xs font-bold text-indigo-650 dark:text-indigo-400 hover:underline"
              onClick={() => {
                setError(null);
                setSuccessMsg(null);
                setIsRegister(!isRegister);
              }}
            >
              {isRegister
                ? "Horay ma u haysataa koonto? Gali halkan (Have an account? Login)"
                : "Haddii aadan lahayn koonto, Diiwaangeli halkan (No account? Register here)"}
            </button>
          )}
        </div>

        {/* Secure badge footer marker */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2 border-t border-slate-100 dark:border-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Secured Encrypted Database</span>
        </div>

      </div>
    </div>
  );
}
