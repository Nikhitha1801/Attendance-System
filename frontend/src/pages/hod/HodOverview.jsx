import { useEffect, useState } from 'react'
import { GraduationCap, Users, BookOpenCheck, Building2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import StatCard from '../../components/StatCard'
import PortalBanner from '../../components/PortalBanner'
import { getHodDashboard } from '../../api/endpoints'
import { useAuth } from '../../context/AuthContext'

export default function HodOverview() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    getHodDashboard()
      .then(setData)
      .catch(() => setError('Could not load dashboard data.'))
  }, [])

  const chartData = data
    ? data.weekly_trend.map((d) => ({
        date: new Date(`${d.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' }),
        percentage: d.percentage,
      }))
    : []

  return (
    <div className="space-y-6">
      <PortalBanner
        icon={Building2}
        label="HOD Portal"
        title="Department Overview"
        subtitle={`Head of Department · GSSSIETW · ${user.name}`}
        gradient="linear-gradient(115deg, #08684f 0%, #078568 48%, #159b8d 100%)"
      />

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {!data && !error && <p className="text-slate-500 text-sm">Loading...</p>}

      {data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Total Students" value={data.students} icon={GraduationCap} accent="#0f9d78" />
            <StatCard label="Faculty Members" value={data.faculty} icon={Users} accent="#5b7cfa" />
            <StatCard label="Subjects" value={data.subjects} icon={BookOpenCheck} accent="#e0672b" />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="font-display font-semibold text-[15px] mb-1 text-slate-900">Attendance by Week</h2>
            <p className="text-xs text-slate-400 mb-4">Average percentage across department classes</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid stroke="#edf0f5" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} tickFormatter={(value) => `${value}%`} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(value) => `${value}%`}
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 8px 24px rgba(15,23,42,.10)' }}
                  labelStyle={{ color: '#0f172a' }}
                  cursor={{ fill: '#0f9d7810' }}
                />
                <Bar dataKey="percentage" fill="#16b98a" fillOpacity={0.16} stroke="#16b98a" strokeWidth={2} radius={[8, 8, 0, 0]} maxBarSize={70} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="mb-4">
              <h2 className="font-display font-semibold text-[15px] text-slate-900">Student Attendance This Week</h2>
              <p className="mt-1 text-xs text-slate-400">
                {data.attendance_week
                  ? `${data.attendance_week.start} to ${data.attendance_week.end} · records below 85% are highlighted`
                  : 'Weekly attendance summary'}
              </p>
            </div>
            {!data.attendance_week ? (
              <p className="py-8 text-center text-sm text-amber-700">
                Weekly attendance is unavailable from the running API. Restart the backend to load the latest dashboard data.
              </p>
            ) : data.attendance_week.students.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No student attendance recorded this week.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-3 py-3 font-medium">Student</th>
                      <th className="px-3 py-3 font-medium">Roll No</th>
                      <th className="px-3 py-3 font-medium">Section</th>
                      <th className="px-3 py-3 font-medium">Present</th>
                      <th className="px-3 py-3 text-right font-medium">Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.attendance_week.students.map((student) => {
                      const belowThreshold = student.percentage < 85
                      return (
                        <tr
                          key={student.student_id}
                          className={`border-b last:border-0 ${belowThreshold ? 'border-red-100 bg-red-50 text-red-800' : 'border-slate-100'}`}
                        >
                          <td className="px-3 py-3 font-medium">{student.name}</td>
                          <td className="px-3 py-3">{student.roll_no}</td>
                          <td className="px-3 py-3">{student.section}</td>
                          <td className="px-3 py-3">{student.present}/{student.total}</td>
                          <td className={`px-3 py-3 text-right font-semibold ${belowThreshold ? 'text-red-700' : 'text-emerald-700'}`}>
                            {student.percentage}%
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
