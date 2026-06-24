import React, { useState, useEffect } from "react";
import {
  Settings,
  ShieldAlert,
  Check,
  RefreshCw,
  Users,
  UserPlus,
  Trash2,
  Edit2,
  X,
  Mail,
  User,
  Fingerprint,
  ChevronRight,
  Shield,
  Briefcase,
  GraduationCap
} from "lucide-react";
import { SchoolSettings, User as UserType } from "../types";

interface SettingsViewProps {
  settings: SchoolSettings;
  onUpdateSettings: (newSettings: Partial<SchoolSettings>) => Promise<void>;
  onFactoryReset: () => Promise<void>;
  currentUser: UserType | null;
  authenticatedFetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
}

export default function SettingsView({
  settings,
  onUpdateSettings,
  onFactoryReset,
  currentUser,
  authenticatedFetch
}: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<"school" | "users">("school");

  // School settings states
  const [schoolName, setSchoolName] = useState(settings.schoolName);
  const [currency, setCurrency] = useState(settings.currency);
  const [feeAmount, setFeeAmount] = useState(settings.feeAmount.toString());
  const [systemTheme, setSystemTheme] = useState(settings.systemTheme);

  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Users management states
  const [users, setUsers] = useState<UserType[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);

  // User form states
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"Admin" | "Teacher" | "Student">("Teacher");
  const [studentId, setStudentId] = useState("");
  const [teacherClass, setTeacherClass] = useState("");
  const [formError, setFormError] = useState("");
  const [formSaving, setFormSaving] = useState(false);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await authenticatedFetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "users" && currentUser?.role === "Admin") {
      fetchUsers();
    }
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onUpdateSettings({
        schoolName,
        currency,
        feeAmount: parseFloat(feeAmount),
        systemTheme,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetClick = async () => {
    if (
      confirm(
        "Are you absolutely sure you want to perform a factory reset? This will delete all student records, financials, and attendance data permanently. Your admin user account will be preserved."
      )
    ) {
      setResetting(true);
      try {
        await onFactoryReset();
      } catch (err) {
        console.error(err);
      } finally {
        setResetting(false);
      }
    }
  };

  const openAddUserModal = () => {
    setEditingUser(null);
    setUsername("");
    setFullName("");
    setEmail("");
    setPassword("");
    setRole("Teacher");
    setStudentId("");
    setTeacherClass("");
    setFormError("");
    setUserModalOpen(true);
  };

  const openEditUserModal = (u: UserType) => {
    setEditingUser(u);
    setUsername(u.username);
    setFullName(u.fullName);
    setEmail(u.email);
    setPassword(""); // leave blank for editing
    setRole(u.role);
    setStudentId(u.studentId || "");
    setTeacherClass(u.teacherClass || "");
    setFormError("");
    setUserModalOpen(true);
  };

  const handleUserFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSaving(true);

    const payload: any = {
      fullName,
      email,
      role,
      studentId: role === "Student" ? studentId : "",
      teacherClass: role === "Teacher" ? teacherClass : ""
    };

    if (!editingUser) {
      payload.username = username;
      payload.password = password;
    } else if (password) {
      payload.password = password;
    }

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
      const method = editingUser ? "PUT" : "POST";

      const res = await authenticatedFetch(url, {
        method,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setUserModalOpen(false);
        fetchUsers();
      } else {
        const data = await res.json();
        setFormError(data.error || "Failed to save user account details.");
      }
    } catch (err) {
      console.error(err);
      setFormError("A network error occurred while updating the accounts database.");
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (id === currentUser?.id) {
      alert("Demoting or deleting your own active admin session is blocked for safety.");
      return;
    }

    if (confirm("Are you sure you want to permanently delete this user account?")) {
      try {
        const res = await authenticatedFetch(`/api/users/${id}`, {
          method: "DELETE"
        });
        if (res.ok) {
          fetchUsers();
        } else {
          const data = await res.json();
          alert(data.error || "Failed to perform user deletion.");
        }
      } catch (err) {
        console.error(err);
        alert("A network error occurred during user account deletion.");
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Settings & Policies
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage general school configurations, financial parameters, and account controls.
        </p>
      </div>

      {currentUser?.role === "Admin" && (
        <div className="border-b border-slate-200 dark:border-slate-700 flex gap-4">
          <button
            onClick={() => setActiveTab("school")}
            className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "school"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <Settings className="w-4 h-4" />
            School Settings
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "users"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <Users className="w-4 h-4" />
            Users & Roles Management
          </button>
        </div>
      )}

      {activeTab === "school" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Core settings form fields columns */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2 mb-2 pb-4 border-b border-slate-100 dark:border-slate-700">
              <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Configure School</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  School Name *
                </label>
                <input
                  type="text"
                  required
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="e.g. Pro Academy"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white text-sm outline-none focus:border-indigo-500 transition-colors font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Currency Symbol
                  </label>
                  <input
                    type="text"
                    required
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    placeholder="e.g. $, USD"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white text-sm outline-none focus:border-indigo-500 transition-colors font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Default Tuition Fee (Monthly)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={feeAmount}
                    onChange={(e) => setFeeAmount(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white text-sm outline-none focus:border-indigo-500 transition-colors font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Interface Theme Preset
                </label>
                <select
                  value={systemTheme}
                  onChange={(e) => setSystemTheme(e.target.value as "light" | "dark")}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 dark:text-white text-sm outline-none focus:border-indigo-500 transition-colors font-semibold"
                >
                  <option value="light">Light Mode</option>
                  <option value="dark">Dark Mode</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/25 active:scale-95 inline-flex items-center gap-1.5"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Save Settings
                </button>
              </div>
            </form>
          </div>

          {/* Danger zone / Reset wipe block columns */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-rose-500/20 dark:border-rose-950/40 shadow-sm space-y-4 h-fit">
            <div className="flex items-center gap-2 pb-2 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <h3 className="text-lg font-bold">Danger Zone</h3>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              Resets student records, historical performance grades, invoices, and attendance. Your admin account and system settings parameters will remain intact.
            </p>

            <button
              onClick={handleResetClick}
              disabled={resetting}
              className="flex items-center justify-center gap-2 py-2.5 px-4 w-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-950 text-xs font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-50"
            >
              {resetting ? (
                <span className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Factory System Reset
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Active System Accounts</h3>
              <p className="text-xs text-gray-500">Create, monitor, and configure system login credentials for staff and students.</p>
            </div>
            <button
              onClick={openAddUserModal}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/25 active:scale-95 self-start sm:self-center"
            >
              <UserPlus className="w-4 h-4" />
              Register User
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-150 dark:border-slate-700 shadow-sm overflow-hidden">
            {usersLoading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3">
                <span className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-gray-405 font-semibold">Reading credentials list...</p>
              </div>
            ) : users.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-date border-slate-100 dark:border-slate-750 bg-slate-50/20 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <th className="p-4 pl-6">Core User</th>
                      <th className="p-4">Contact Info</th>
                      <th className="p-4">Role Assigned</th>
                      <th className="p-4">Context Details</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm font-semibold">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/20 dark:hover:bg-slate-900/10 transition-colors">
                        <td className="p-4 pl-6 flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                            u.role === "Admin" ? "bg-amber-100 dark:bg-amber-950 text-amber-600" :
                            u.role === "Teacher" ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-600" :
                            "bg-emerald-100 dark:bg-emerald-950 text-emerald-600"
                          }`}>
                            {u.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-gray-900 dark:text-white capitalize">{u.fullName}</div>
                            <div className="text-[10px] text-gray-400 tracking-wider">@{u.username}</div>
                          </div>
                        </td>
                        <td className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400">
                          <label className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {u.email}</label>
                        </td>
                        <td className="p-4 text-xs">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1 ${
                            u.role === "Admin" ? "bg-amber-50 dark:bg-amber-950 text-amber-700" :
                            u.role === "Teacher" ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700" :
                            "bg-emerald-50 dark:bg-emerald-950 text-emerald-700"
                          }`}>
                            {u.role === "Admin" && <Shield className="w-3 h-3" />}
                            {u.role === "Teacher" && <Briefcase className="w-3 h-3" />}
                            {u.role === "Student" && <GraduationCap className="w-3 h-3" />}
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-gray-400 font-semibold italic">
                          {u.role === "Teacher" && (u.teacherClass ? `Assigned Class: ${u.teacherClass}` : "No assigned class")}
                          {u.role === "Student" && (u.studentId ? `SIS Link ID: ${u.studentId.substring(0, 8)}...` : "Standalone profile")}
                          {u.role === "Admin" && "System Administration"}
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => openEditUserModal(u)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors"
                              title="Edit user details"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              disabled={u.id === currentUser?.id}
                              className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 rounded-lg transition-colors disabled:opacity-30"
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-16 text-center text-gray-400">
                <Users className="w-12 h-12 text-slate-350 mx-auto stroke-1" />
                <p className="font-semibold text-sm text-gray-500 mt-2">No user records loaded.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Register/Edit User Modal Overlay */}
      {userModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-150 dark:border-slate-700 w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-gray-900 dark:text-white">
                  {editingUser ? "Edit Accounts Record" : "Register System Credentials"}
                </h3>
              </div>
              <button
                onClick={() => setUserModalOpen(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-455"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUserFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200/50 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-400 font-bold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Login Username *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingUser}
                    placeholder="e.g. jamal01"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white outline-none focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jamal Hassan Ahmed"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. jamal@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Password {editingUser && "(Leave blank to keep current)"} *
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Account Role Protection *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 dark:text-white outline-none focus:border-indigo-500"
                  >
                    <option value="Admin">Admin (Access control + Analytics)</option>
                    <option value="Teacher">Teacher (Class management + Grades)</option>
                    <option value="Student">Student (Check attendance + Reports)</option>
                  </select>
                </div>

                {role === "Teacher" && (
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Assigned Class (e.g. 1, 2, 3)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1"
                      value={teacherClass}
                      onChange={(e) => setTeacherClass(e.target.value)}
                      className="w-full px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                )}

                {role === "Student" && (
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Student SIS Profile ID Link
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Paste student ID hash from registry"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className="w-full px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-slate-700 dark:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-750 disabled:bg-indigo-400 text-white rounded-lg flex items-center gap-1"
                >
                  {formSaving && (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {editingUser ? "Update User" : "Register Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
