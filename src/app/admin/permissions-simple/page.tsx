"use client";
import { useEffect, useState } from "react";
import clsx from "clsx";
import toast from "react-hot-toast";

interface User {
    id: number;
    name: string | null;
    email: string;
    role: string;
}

interface ScreenPermission {
    screen: string;
    label: string;
    labelAr: string;
    description: string;
}

interface LawyerPermission {
    canAssignTasks: boolean;
    canViewTime: boolean;
    canApproveTime: boolean;
    assignedLawyerIds: number[];
}

interface UserScreenPermissions {
    screens: string[];
    lawyerPermissions: LawyerPermission;
}

const SCREENS: ScreenPermission[] = [
    { screen: "dashboard", label: "Dashboard", labelAr: "لوحة التحكم", description: "View dashboard overview" },
    { screen: "clients", label: "Clients", labelAr: "العملاء", description: "Manage client information" },
    { screen: "projects", label: "Projects", labelAr: "المشاريع", description: "Manage projects and cases" },
    { screen: "tasks", label: "Tasks", labelAr: "المهام", description: "Create and manage tasks" },
    { screen: "time", label: "Time Tracking", labelAr: "تتبع الوقت", description: "Log and view time entries" },
    { screen: "expenses", label: "Expenses", labelAr: "المصروفات", description: "Manage expenses" },
    { screen: "leaves", label: "Leaves", labelAr: "الإجازات", description: "Manage leave requests" },
    { screen: "invoices", label: "Invoices", labelAr: "الفواتير", description: "Create and manage invoices" },
    { screen: "reports", label: "Reports", labelAr: "التقارير", description: "View reports and analytics" },
    { screen: "admin_time", label: "Admin Time", labelAr: "إدارة الوقت", description: "Approve time entries" },
    { screen: "accounts", label: "Accounts", labelAr: "الحسابات", description: "Manage chart of accounts" },
    { screen: "payroll", label: "Payroll", labelAr: "الرواتب", description: "Manage payroll" },
    { screen: "settings", label: "Settings", labelAr: "الإعدادات", description: "System settings" },
    { screen: "hr", label: "HR", labelAr: "الموارد البشرية", description: "Human resources management" },
    { screen: "employees", label: "Employees", labelAr: "الموظفين", description: "Manage employees" },
];

function authHeaders(): Record<string, string> {
    if (typeof window === "undefined") return {};
    const token = localStorage.getItem("authToken") ?? localStorage.getItem("token") ?? "";
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function SimplePermissionsPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [lawyers, setLawyers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userPermissions, setUserPermissions] = useState<UserScreenPermissions>({
        screens: [],
        lawyerPermissions: {
            canAssignTasks: false,
            canViewTime: false,
            canApproveTime: false,
            assignedLawyerIds: [],
        },
    });
    const [loading, setLoading] = useState(false);

    // Load users on mount
    useEffect(() => {
        fetch("/api/users", { headers: authHeaders() })
            .then((r) => r.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setUsers(data);
                    setLawyers(data.filter((u: User) => u.role === "LAWYER" || u.role === "LAWYER_MANAGER" || u.role === "LAWYER_PARTNER"));
                }
            });
    }, []);

    // Load permissions when user is selected
    useEffect(() => {
        if (!selectedUser) return;
        fetch(`/api/user-permissions?userId=${selectedUser.id}`, { headers: authHeaders() })
            .then((r) => r.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    const screens = data.filter((p: any) => p.enabled).map((p: any) => p.page);
                    const lawyerPerm = data.find((p: any) => p.page === "lawyer_management");
                    setUserPermissions({
                        screens,
                        lawyerPermissions: lawyerPerm ? {
                            canAssignTasks: lawyerPerm.itemIds?.includes(1) || false,
                            canViewTime: lawyerPerm.itemIds?.includes(2) || false,
                            canApproveTime: lawyerPerm.itemIds?.includes(3) || false,
                            assignedLawyerIds: lawyerPerm.lawyerIds || [],
                        } : {
                            canAssignTasks: false,
                            canViewTime: false,
                            canApproveTime: false,
                            assignedLawyerIds: [],
                        },
                    });
                }
            });
    }, [selectedUser]);

    const toggleScreen = (screen: string) => {
        setUserPermissions((prev) => ({
            ...prev,
            screens: prev.screens.includes(screen)
                ? prev.screens.filter((s) => s !== screen)
                : [...prev.screens, screen],
        }));
    };

    const toggleLawyerPermission = (key: keyof Omit<LawyerPermission, "assignedLawyerIds">) => {
        setUserPermissions((prev) => ({
            ...prev,
            lawyerPermissions: {
                ...prev.lawyerPermissions,
                [key]: !prev.lawyerPermissions[key],
            },
        }));
    };

    const toggleAssignedLawyer = (lawyerId: number) => {
        setUserPermissions((prev) => ({
            ...prev,
            lawyerPermissions: {
                ...prev.lawyerPermissions,
                assignedLawyerIds: prev.lawyerPermissions.assignedLawyerIds.includes(lawyerId)
                    ? prev.lawyerPermissions.assignedLawyerIds.filter((id) => id !== lawyerId)
                    : [...prev.lawyerPermissions.assignedLawyerIds, lawyerId],
            },
        }));
    };

    const savePermissions = async () => {
        if (!selectedUser) return;
        setLoading(true);
        try {
            // Save screen permissions
            const screenPerms = SCREENS.map((s) => ({
                page: s.screen,
                enabled: userPermissions.screens.includes(s.screen),
            }));

            // Save lawyer management permissions
            const lawyerManagementPerm = {
                page: "lawyer_management",
                enabled: userPermissions.lawyerPermissions.canAssignTasks ||
                    userPermissions.lawyerPermissions.canViewTime ||
                    userPermissions.lawyerPermissions.canApproveTime,
                itemIds: [
                    userPermissions.lawyerPermissions.canAssignTasks ? 1 : 0,
                    userPermissions.lawyerPermissions.canViewTime ? 2 : 0,
                    userPermissions.lawyerPermissions.canApproveTime ? 3 : 0,
                ].filter((id) => id > 0),
                lawyerIds: userPermissions.lawyerPermissions.assignedLawyerIds,
            };

            const allPerms = [...screenPerms, lawyerManagementPerm];

            const res = await fetch("/api/user-permissions", {
                method: "POST",
                headers: { "Content-Type": "application/json", ...authHeaders() },
                body: JSON.stringify({ userId: selectedUser.id, permissions: allPerms }),
            });

            if (res.ok) {
                toast.success("تم حفظ الصلاحيات بنجاح");
            } else {
                toast.error("فشل في حفظ الصلاحيات");
            }
        } catch (error) {
            toast.error("حدث خطأ");
        }
        setLoading(false);
    };

    const selectAllScreens = () => {
        setUserPermissions((prev) => ({
            ...prev,
            screens: SCREENS.map((s) => s.screen),
        }));
    };

    const clearAllScreens = () => {
        setUserPermissions((prev) => ({
            ...prev,
            screens: [],
        }));
    };

    return (
        <div className="dashboard-container">
            <header className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <h1 className="text-4xl font-serif text-white mb-2 tracking-tight">إدارة الصلاحيات</h1>
                <p className="text-slate-400 font-light max-w-xl">تعيين الشاشات والصلاحيات للمستخدمين بسهولة</p>
            </header>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Users list */}
                <aside className="lg:w-1/3 xl:w-1/4 space-y-8">
                    <div className="legal-card p-6">
                        <h2 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-6">قائم�� المستخدمين</h2>
                        <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                            {users.map((u) => (
                                <div
                                    key={u.id}
                                    className={clsx(
                                        "cursor-pointer rounded-xl px-4 py-3 border transition-all duration-300 group",
                                        selectedUser?.id === u.id
                                            ? "bg-legal-gold/10 border-legal-gold/30"
                                            : "bg-white/5 border-white/5 hover:bg-white/10"
                                    )}
                                    onClick={() => setSelectedUser(u)}
                                >
                                    <div className="flex flex-col gap-1">
                                        <span
                                            className={clsx(
                                                "text-sm font-medium transition-colors",
                                                selectedUser?.id === u.id ? "text-legal-gold" : "text-slate-300 group-hover:text-white"
                                            )}
                                        >
                                            {u.name || "بدون اسم"}
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-light truncate">{u.email}</span>
                                        <span className="text-[9px] text-legal-gold/60 font-medium">{u.role}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Permissions panel */}
                <main className="flex-1">
                    {selectedUser ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-700">
                            {/* Header */}
                            <div className="legal-card p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-serif text-white">صلاحيات: {selectedUser.name || selectedUser.email}</h2>
                                        <p className="text-xs text-slate-500 font-light mt-1">اختر الشاشات والصلاحيات المطلوبة</p>
                                    </div>
                                    <button onClick={savePermissions} disabled={loading} className="btn-legal px-8">
                                        {loading ? "جاري الحفظ..." : "حفظ الصلاحيات"}
                                    </button>
                                </div>
                            </div>

                            {/* Screen permissions */}
                            <div className="legal-card p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-serif text-white">الشاشات المتاحة</h3>
                                    <div className="flex gap-2">
                                        <button onClick={selectAllScreens} className="text-[10px] text-legal-gold hover:text-white transition-colors">
                                            تحديد الكل
                                        </button>
                                        <span className="text-slate-600">|</span>
                                        <button onClick={clearAllScreens} className="text-[10px] text-slate-400 hover:text-white transition-colors">
                                            إلغاء الكل
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {SCREENS.map((screen) => (
                                        <label
                                            key={screen.screen}
                                            className={clsx(
                                                "flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-300",
                                                userPermissions.screens.includes(screen.screen)
                                                    ? "bg-legal-gold/10 border-legal-gold/30"
                                                    : "bg-white/5 border-white/5 hover:bg-white/10"
                                            )}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={userPermissions.screens.includes(screen.screen)}
                                                onChange={() => toggleScreen(screen.screen)}
                                                className="w-5 h-5 rounded border-white/10 bg-white/5 checked:bg-legal-gold checked:border-legal-gold transition-all cursor-pointer mt-0.5"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-white">{screen.labelAr}</span>
                                                    <span className="text-[10px] text-slate-500">({screen.label})</span>
                                                </div>
                                                <p className="text-[11px] text-slate-400 mt-1">{screen.description}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Lawyer management permissions */}
                            <div className="legal-card p-6">
                                <h3 className="text-lg font-serif text-white mb-6">صلاحيات إدارة المحامين</h3>
                                <p className="text-xs text-slate-400 mb-6">هذه الصلاحيات تسمح للمستخدم بالتعامل مع المحاميين الآخرين</p>

                                <div className="space-y-4 mb-8">
                                    <label className="flex items-center gap-3 p-4 rounded-xl border bg-white/5 border-white/5 hover:bg-white/10 cursor-pointer transition-all">
                                        <input
                                            type="checkbox"
                                            checked={userPermissions.lawyerPermissions.canAssignTasks}
                                            onChange={() => toggleLawyerPermission("canAssignTasks")}
                                            className="w-5 h-5 rounded border-white/10 bg-white/5 checked:bg-legal-gold checked:border-legal-gold transition-all cursor-pointer"
                                        />
                                        <div>
                                            <span className="text-sm font-medium text-white">تعيين المهام</span>
                                            <p className="text-[11px] text-slate-400 mt-1">يمكنه تعيين مهام للمحاميين المحددين</p>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-3 p-4 rounded-xl border bg-white/5 border-white/5 hover:bg-white/10 cursor-pointer transition-all">
                                        <input
                                            type="checkbox"
                                            checked={userPermissions.lawyerPermissions.canViewTime}
                                            onChange={() => toggleLawyerPermission("canViewTime")}
                                            className="w-5 h-5 rounded border-white/10 bg-white/5 checked:bg-legal-gold checked:border-legal-gold transition-all cursor-pointer"
                                        />
                                        <div>
                                            <span className="text-sm font-medium text-white">عرض سجلات الوقت</span>
                                            <p className="text-[11px] text-slate-400 mt-1">يمكنه عرض سجلات الوقت للمحاميين المحددين</p>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-3 p-4 rounded-xl border bg-white/5 border-white/5 hover:bg-white/10 cursor-pointer transition-all">
                                        <input
                                            type="checkbox"
                                            checked={userPermissions.lawyerPermissions.canApproveTime}
                                            onChange={() => toggleLawyerPermission("canApproveTime")}
                                            className="w-5 h-5 rounded border-white/10 bg-white/5 checked:bg-legal-gold checked:border-legal-gold transition-all cursor-pointer"
                                        />
                                        <div>
                                            <span className="text-sm font-medium text-white">الموافقة على سجلات الوقت</span>
                                            <p className="text-[11px] text-slate-400 mt-1">يمكنه الموافقة على سجلات الوقت للمحاميين المحددين</p>
                                        </div>
                                    </label>
                                </div>

                                {/* Assigned lawyers */}
                                {(userPermissions.lawyerPermissions.canAssignTasks ||
                                    userPermissions.lawyerPermissions.canViewTime ||
                                    userPermissions.lawyerPermissions.canApproveTime) && (
                                        <div>
                                            <h4 className="text-sm font-medium text-white mb-4">المحاميين المسموح بالتعامل معهم</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                                {lawyers.map((lawyer) => (
                                                    <label
                                                        key={lawyer.id}
                                                        className={clsx(
                                                            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                                                            userPermissions.lawyerPermissions.assignedLawyerIds.includes(lawyer.id)
                                                                ? "bg-legal-gold/10 border-legal-gold/30"
                                                                : "bg-white/5 border-white/5 hover:bg-white/10"
                                                        )}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={userPermissions.lawyerPermissions.assignedLawyerIds.includes(lawyer.id)}
                                                            onChange={() => toggleAssignedLawyer(lawyer.id)}
                                                            className="w-4 h-4 rounded border-white/10 bg-white/5 checked:bg-legal-gold checked:border-legal-gold transition-all cursor-pointer"
                                                        />
                                                        <div>
                                                            <span className="text-sm text-white">{lawyer.name || lawyer.email}</span>
                                                            <span className="text-[10px] text-slate-500 block">{lawyer.role}</span>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                            </div>
                        </div>
                    ) : (
                        <div className="legal-card p-16 h-full flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                                <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-serif text-white mb-2">اختر مستخدم</h3>
                            <p className="text-slate-500 text-sm max-w-xs font-light">اختر مستخدم من القائمة لتعديل صلاحياته</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
