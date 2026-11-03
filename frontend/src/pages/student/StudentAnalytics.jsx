import { useEffect, useState } from 'react'
import { CalendarCheck, GraduationCap, TrendingUp } from 'lucide-react'
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts'
import StatCard from '../../components/StatCard'
import { myAttendanceRecords, myAttendanceSummary } from '../../api/endpoints'

export default function StudentAnalytics() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([myAttendanceSummary(), myAttendanceRecords()])
      .then(([subjects, records]) => setData({ subjects, records }))
      .catch((err) => setError(err.response?.data?.detail || 'Could not load your attendance analytics.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-slate-400 text-sm">Loading analytics...</p>
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>

  const recordsByDate = new Map()
  data.records.forEach((record) => {
    const day = recordsByDate.get(record.date) || { date: record.date, present: 0, total: 0 }
    day.total += 1
    if (record.status === 'present') day.present += 1
    recordsByDate.set(record.date, day)
  })
  const trend = [...recordsByDate.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14)
    .map((day) => ({
      ...day,
      label: day.date.slice(5),
      percentage: Math.round((day.present / day.total) * 1000) / 10,
    }))

  const totalRecords = data.records.length
  const presentRecords = data.records.filter((record) => record.status === 'present').length
  const attendanceRate = totalRecords
    ? Math.round((presentRecords / totalRecords) * 1000) / 10
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-xl text-ink-900">Attendance Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">Your attendance performance and subject breakdown.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Overall Attendance" value={attendanceRate} suffix="%" icon={TrendingUp} accent="#e0672b" />
        <StatCard label="Classes Present" value={presentRecords} icon={CalendarCheck} accent="#0f9d78" />
        <StatCard label="Subjects Tracked" value={data.subjects.length} icon={GraduationCap} accent="#5b7cfa" />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4">
          <h2 className="font-display text-sm font-semibold text-ink-900">Attendance by Class Date</h2>
          <p className="text-xs text-slate-500">Your 14 most recent class dates</p>
        </div>
        {trend.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-400">No attendance records yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="#64748b" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(value) => `${value}%`} stroke="#64748b" />
              <Tooltip formatter={(value, _name, item) => [`${value}% · ${item.payload.present}/${item.payload.total} present`, 'Attendance']} />
              <Line
                type="monotone"
                dataKey="percentage"
                name="Attendance"
                stroke="#e0672b"
                strokeWidth={2}
                dot={{ r: 3, fill: '#e0672b', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4">
          <h2 className="font-display text-sm font-semibold text-ink-900">Attendance by Subject</h2>
          <p className="text-xs text-slate-500">Your recorded attendance for each subject</p>
        </div>
        {data.subjects.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">No subject attendance data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(200, data.subjects.length * 48)}>
            <BarChart data={data.subjects} layout="vertical" margin={{ left: 8, right: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(value) => `${value}%`} />
              <YAxis type="category" dataKey="subject_name" width={112} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value, _name, item) => [`${value}% · ${item.payload.present_count}/${item.payload.total_sessions} present`, 'Attendance']} />
              <Bar dataKey="percentage" name="Attendance" fill="#0f9d78" radius={[0, 5, 5, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>
    </div>
  )
}
