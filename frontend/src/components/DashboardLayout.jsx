import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  ScanFace, LayoutDashboard, Users, Building2, DoorOpen, CalendarDays, CalendarCheck,
  FileSpreadsheet, UserCog, LogOut, Camera, History, ChevronRight, BarChart3,
  ShieldCheck, Settings, Video, Repeat, Bell, UserRound, BookOpen, MonitorPlay,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const ROLE_COLOR = {
  admin: '#7c3aed',
  hod: '#0f9d78',
  faculty: '#2563eb',
  student: '#e0672b',
}

const NAV_ITEMS = {
  admin: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/departments', label: 'Departments', icon: Building2 },
    { to: '/admin/subjects', label: 'Subjects', icon: BookOpen },
    { to: '/admin/classrooms', label: 'Classrooms', icon: DoorOpen },
    { to: '/admin/timetable', label: 'Timetable', icon: CalendarDays },
    { to: '/admin/attendance/start', label: 'Auto Attendance', icon: MonitorPlay },
    { to: '/admin/attendance', label: 'Attendance', icon: CalendarCheck },
    { to: '/admin/reports', label: 'Reports', icon: FileSpreadsheet },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/admin/cameras', label: 'Live Classes', icon: Video },
    { to: '/kiosk', label: 'Auto Mode Kiosk', icon: MonitorPlay, external: true },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: ShieldCheck },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ],
  hod: [
    { to: '/hod', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/hod/faculty', label: 'Faculty', icon: UserCog },
    { to: '/hod/attendance', label: 'Attendance', icon: CalendarCheck },
    { to: '/hod/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/hod/recordings', label: 'Live Classrooms', icon: Video },
    { to: '/hod/reports', label: 'Reports', icon: FileSpreadsheet },
    { to: '/hod/swap-requests', label: 'Swap Requests', icon: Repeat },
  ],
  faculty: [
    { to: '/faculty', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/faculty/timetable', label: 'My Timetable', icon: CalendarDays },
    { to: '/faculty/log', label: 'Attendance Log', icon: History },
    { to: '/faculty/reports', label: 'Reports', icon: FileSpreadsheet },
    { to: '/faculty/swap-requests', label: 'Swap Requests', icon: Repeat },
    { to: '/faculty/notifications', label: 'Notifications', icon: Bell },
  ],
  student: [
    { to: '/student', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/student/attendance', label: 'My Attendance', icon: CalendarCheck },
    { to: '/student/history', label: 'History', icon: History },
    { to: '/student/face', label: 'Face Registration', icon: Camera },
    { to: '/student/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/student/profile', label: 'Profile', icon: UserRound },
  ],
}

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const items = NAV_ITEMS[user.role] || []
  const accentColor = ROLE_COLOR[user.role]

  const currentItem =
    [...items].sort((a, b) => b.to.length - a.to.length).find((i) => location.pathname.startsWith(i.to)) || items[0]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="dashboard-shell min-h-screen flex">
      <aside className="dashboard-sidebar w-64 shrink-0 flex flex-col">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.07]">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
            style={{ background: `linear-gradient(135deg, ${accentColor}, #4969f5)`, boxShadow: `0 5px 18px ${accentColor}45` }}
          >
            <ScanFace className="w-5 h-5 text-white" strokeWidth={1.75} />
          </div>
          <div>
            <p className="font-display font-bold text-sm leading-none text-white tracking-[0.12em]">
              ATTEND<span style={{ color: accentColor }}>IFY</span>
            </p>
            <p className="text-[9px] text-white/35 mt-1.5 tracking-[0.18em]">GSSSIETW</p>
          </div>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1.5 overflow-y-auto">
          {items.map((item) => {
            const Icon = item.icon
            if (item.external) {
              return (
                <a
                  key={item.to}
                  href={item.to}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dashboard-nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-white/55 hover:bg-white/[0.05] hover:text-white/90"
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                </a>
              )
            }
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `dashboard-nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                    isActive
                      ? 'is-active text-white'
                      : 'text-white/55 hover:bg-white/[0.05] hover:text-white/90'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className="w-4 h-4 shrink-0"
                      style={{ color: isActive ? accentColor : undefined }}
                    />
                    <span className="flex-1">{item.label}</span>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/35" />}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        <div className="dashboard-sidebar-footer p-3">
          <div className="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-xl border border-white/[0.07] bg-white/[0.035]">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 text-white shadow-md"
              style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)`, boxShadow: `0 4px 12px ${accentColor}35` }}
            >
              {user.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-[10px] mt-0.5 capitalize" style={{ color: accentColor }}>{user.role === 'hod' ? 'Head of Dept' : user.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/50 hover:bg-white/[0.05] hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="dashboard-header h-[68px] shrink-0 flex items-center justify-between px-6 lg:px-7">
          <div>
            <p className="font-display font-bold text-[15px] text-ink-900 leading-none">{currentItem?.label}</p>
            <p className="text-[11px] text-slate-400 mt-1">GSSSIETW · Attendify</p>
          </div>
          <div className="flex items-center gap-3">
            {user.role === 'hod' && <span className="hidden sm:block w-1.5 h-1.5 rounded-full bg-red-500" aria-label="Notifications" />}
            <div className="hidden sm:block w-px h-7 bg-slate-200" />
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 text-white shadow-md"
              style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)`, boxShadow: `0 4px 12px ${accentColor}30` }}
            >
              {user.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-ink-900 leading-none">{user.name}</p>
              <p className="text-[10px] text-slate-400 mt-1 capitalize">{user.role}</p>
            </div>
          </div>
        </header>
        <main className="dashboard-main flex-1 overflow-y-auto p-5 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
