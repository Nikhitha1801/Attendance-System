import { useEffect, useState } from 'react'
import { Users, Building2, Camera, ClipboardList, Sparkles } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Link } from 'react-router-dom'
import StatCard from '../../components/StatCard'
import PortalBanner from '../../components/PortalBanner'
import { getAdminDashboard } from '../../api/endpoints'
import { useAuth } from '../../context/AuthContext'

const PIE_COLORS = ['#5b7cfa', '#0f9d78', '#7c3aed', '#e0672b']

export default function AdminOverview() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    getAdminDashboard()
      .then(setData)
      .catch((err) => setError(err.response?.data?.detail || 'Could not load dashboard data.'))
  }, [])

  if (error) return <p className="text-red-500 text-sm">{error}</p>
  if (!data) return <p className="text-slate-400 text-sm">Loading...</p>

  const chartData = data.weekly_trend.map((d) => ({
    date: new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' }),
    percentage: d.percentage,
  }))

  return (
    <div className="space-y-6">
      <PortalBanner
        icon={Sparkles}
        label="Admin Portal"
        title={`Welcome back, ${user.name.split(' ')[0]} 👋`}
        subtitle="GSSSIETW · Attendify AI Attendance System"
        badge="AI-Powered"
        gradient="linear-gradient(135deg, #7c3aed, #4f46e5)"
        action={
          <Link to="/admin/attendance/start" className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-white/25 bg-emerald-500/90 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-950/15 transition hover:bg-emerald-400">
            <Camera className="w-4 h-4" /> Start Attendance
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={data.total_users} icon={Users} accent="#5b7cfa" />
        <StatCard label="Departments" value={data.total_departments} icon={Building2} accent="#7c3aed" />
        <StatCard label="Attendance Sessions" value={data.total_sessions} icon={Camera} accent="#0f9d78" />
        <StatCard label="Today's Classes" value={data.today_classes} icon={ClipboardList} accent="#e0672b" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="font-display font-semibold text-[15px] text-ink-900 mb-1">Weekly Attendance Trend</h2>
          <p className="text-xs text-slate-400 mb-4">Average across all departments</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid stroke="#edf0f5" vertical={false} />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 8px 24px rgba(15,23,42,.10)' }} />
              <Bar dataKey="percentage" fill="#4384f4" fillOpacity={0.18} stroke="#4384f4" strokeWidth={2} radius={[8, 8, 0, 0]} maxBarSize={62} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="font-display font-semibold text-[15px] text-ink-900 mb-2">User Roles Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data.role_distribution}
                dataKey="count"
                nameKey="role"
                innerRadius={62}
                outerRadius={98}
                paddingAngle={2}
              >
                {data.role_distribution.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Departments */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-display font-semibold text-sm text-ink-900 mb-4">Departments</h2>
        <div className="space-y-2">
          {data.by_department.map((d) => (
            <div
              key={d.code}
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 border border-slate-100"
            >
              <div>
                <p className="text-sm font-medium text-ink-900">{d.department}</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{d.code}</p>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-right">
                  <p className="font-semibold text-ink-900">{d.students}</p>
                  <p className="text-[10px] text-slate-400">Students</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-ink-900">{d.faculty}</p>
                  <p className="text-[10px] text-slate-400">Faculty</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
