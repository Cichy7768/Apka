import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { calculateScore } from '@/lib/scoring'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, RadialBarChart, RadialBar, ComposedChart,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Trophy, Plus, Pencil, Trash2, AlignLeft, BarChart2, Circle, Donut, Radar } from 'lucide-react'
import PersonForm from './PersonForm'

const PALETTE = [
  '#f59e0b', '#94a3b8', '#b45309',
  '#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#84cc16', '#f97316', '#06b6d4',
]

const MEDALS = ['🥇', '🥈', '🥉']

const avatarUrl = (name) =>
  `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`

const CHART_TYPES = [
  { id: 'horizontal', label: 'Poziome',  icon: AlignLeft  },
  { id: 'vertical',   label: 'Pionowe',  icon: BarChart2  },
  { id: 'lollipop',   label: 'Wyścig',   icon: Circle     },
  { id: 'donut',      label: 'Donut',    icon: Donut      },
  { id: 'radial',     label: 'Radialny', icon: Radar      },
]

/* ── Tooltip ── */
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-popover p-3 shadow-md text-sm">
      <p className="font-semibold">{payload[0].payload.name}</p>
      <p className="text-muted-foreground">
        Wynik: <span className="text-foreground font-bold">{payload[0].value}</span>
      </p>
    </div>
  )
}

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const { name, score, percent } = payload[0].payload
  return (
    <div className="rounded-lg border bg-popover p-3 shadow-md text-sm">
      <p className="font-semibold">{name}</p>
      <p className="text-muted-foreground">
        Wynik: <span className="text-foreground font-bold">{score}</span>
        {' '}·{' '}
        <span className="font-bold">{(percent * 100).toFixed(1)}%</span>
      </p>
    </div>
  )
}

/* ── Lollipop custom shape ── */
const LollipopShape = (props) => {
  const { x, y, width, height, fill } = props
  const cx = x + width
  const cy = y + height / 2
  return (
    <g>
      <line x1={x} y1={cy} x2={cx - 6} y2={cy} stroke={fill} strokeWidth={2} />
      <circle cx={cx} cy={cy} r={7} fill={fill} stroke="hsl(var(--background))" strokeWidth={2} />
    </g>
  )
}

/* ── Radial custom label ── */
const RadialLabel = ({ cx, cy, innerRadius, outerRadius, midAngle, name, score }) => {
  const RADIAN = Math.PI / 180
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return null // handled by built-in label
}

/* ════════════════════════════════════════════════════════════ */
export default function RankingChart({ session }) {
  const [persons,    setPersons]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [chartType,  setChartType]  = useState('horizontal')
  const [formOpen,   setFormOpen]   = useState(false)
  const [editPerson, setEditPerson] = useState(null)

  const fetchPersons = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('persons').select('*')
    if (data) setPersons(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchPersons() }, [fetchPersons])

  const handleSave = () => { setFormOpen(false); setEditPerson(null); fetchPersons() }
  const handleDelete = async (id, name) => {
    if (!confirm(`Na pewno usunąć "${name}"?`)) return
    await supabase.from('persons').delete().eq('id', id)
    fetchPersons()
  }
  const openEdit = (person) => { setEditPerson(person); setFormOpen(true) }

  const ranked = [...persons]
    .map(p => ({ ...p, score: calculateScore(p) }))
    .sort((a, b) => b.score - a.score)

  const chartData = ranked.map((p, i) => ({ ...p, fill: PALETTE[i] ?? PALETTE[PALETTE.length - 1] }))

  /* ── Empty state ── */
  if (loading) return <div className="flex justify-center py-20 text-muted-foreground">Ładowanie...</div>

  return (
    <div className="space-y-6">

      {/* Admin: dodaj */}
      {session && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { setEditPerson(null); setFormOpen(true) }}>
            <Plus className="mr-1 h-4 w-4" /> Dodaj osobę
          </Button>
        </div>
      )}

      {formOpen && (
        <PersonForm
          person={editPerson}
          onSave={handleSave}
          onClose={() => { setFormOpen(false); setEditPerson(null) }}
        />
      )}

      {ranked.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Trophy className="h-14 w-14 opacity-20" />
          <p>Brak danych do wyświetlenia rankingu</p>
          {session && (
            <Button variant="outline" size="sm" onClick={() => setFormOpen(true)}>
              <Plus className="mr-1 h-4 w-4" /> Dodaj pierwszą osobę
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Podium top 3 */}
          {ranked.length >= 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {ranked.slice(0, 3).map((person, i) => (
                <Card key={person.id} className={i === 0 ? 'border-yellow-500/50 bg-yellow-500/5' : ''}>
                  <CardContent className="pt-5 text-center relative">
                    {session && (
                      <div className="absolute top-2 right-2 flex gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-50 hover:opacity-100" onClick={() => openEdit(person)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-50 hover:opacity-100" onClick={() => handleDelete(person.id, person.name)}>
                          <Trash2 className="h-3 w-3 text-red-400" />
                        </Button>
                      </div>
                    )}
                    <div className="relative inline-block mb-2">
                      <img
                        src={avatarUrl(person.name)}
                        alt={person.name}
                        className="w-16 h-16 rounded-full bg-muted mx-auto"
                      />
                      <span className="absolute -bottom-1 -right-1 text-xl leading-none">{MEDALS[i]}</span>
                    </div>
                    <p className="font-bold text-lg leading-tight mt-1">{person.name}</p>
                    <p className="text-3xl font-black mt-1" style={{ color: PALETTE[i] }}>{person.score}</p>
                    <p className="text-xs text-muted-foreground">pkt</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Wykres z przełącznikiem */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Ranking punktowy
                </CardTitle>
                {/* Przełącznik typów wykresu */}
                <div className="flex gap-1 flex-wrap">
                  {CHART_TYPES.map(({ id, label, icon: Icon }) => (
                    <Button
                      key={id}
                      variant={chartType === id ? 'default' : 'ghost'}
                      size="sm"
                      className="h-7 px-2 text-xs gap-1"
                      onClick={() => setChartType(id)}
                    >
                      <Icon className="h-3 w-3" />
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>

              {/* 1 — Poziome słupki */}
              {chartType === 'horizontal' && (
                <ResponsiveContainer width="100%" height={Math.max(280, ranked.length * 44)}>
                  <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 48, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" domain={[0, 'auto']} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fill: 'hsl(var(--foreground))', fontSize: 13 }} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                    <Bar dataKey="score" radius={[0, 4, 4, 0]} label={{ position: 'right', fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}>
                      {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}

              {/* 2 — Pionowe słupki */}
              {chartType === 'vertical' && (
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} angle={-35} textAnchor="end" interval={0} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                    <Bar dataKey="score" radius={[4, 4, 0, 0]} label={{ position: 'top', fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}>
                      {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}

              {/* 3 — Lollipop (Wyścig) */}
              {chartType === 'lollipop' && (
                <ResponsiveContainer width="100%" height={Math.max(280, ranked.length * 44)}>
                  <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 48, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" domain={[0, 'auto']} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fill: 'hsl(var(--foreground))', fontSize: 13 }} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                    <Bar dataKey="score" shape={<LollipopShape />} label={{ position: 'right', fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}>
                      {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}

              {/* 4 — Donut */}
              {chartType === 'donut' && (
                <ResponsiveContainer width="100%" height={380}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%" cy="50%"
                      innerRadius="45%"
                      outerRadius="70%"
                      dataKey="score"
                      nameKey="name"
                      paddingAngle={2}
                      label={({ name, score }) => `${name}: ${score}`}
                      labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                    >
                      {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}

              {/* 5 — Radialny */}
              {chartType === 'radial' && (
                <ResponsiveContainer width="100%" height={400}>
                  <RadialBarChart
                    data={[...chartData].reverse()}
                    cx="50%" cy="50%"
                    innerRadius="15%"
                    outerRadius="90%"
                    startAngle={180}
                    endAngle={-180}
                  >
                    <RadialBar
                      dataKey="score"
                      background={{ fill: 'hsl(var(--muted))' }}
                      label={{ position: 'insideStart', fill: 'hsl(var(--background))', fontSize: 11, fontWeight: 'bold' }}
                    >
                      {[...chartData].reverse().map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </RadialBar>
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value, entry) => (
                        <span style={{ color: 'hsl(var(--foreground))', fontSize: 12 }}>
                          {entry.payload.name} · {entry.payload.score}
                        </span>
                      )}
                    />
                    <Tooltip content={<CustomTooltip />} />
                  </RadialBarChart>
                </ResponsiveContainer>
              )}

            </CardContent>
          </Card>

          {/* Admin: lista z akcjami */}
          {session && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground font-normal">Zarządzaj osobami</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {ranked.map((person, i) => (
                    <div key={person.id} className="flex items-center justify-between px-4 py-2 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground text-sm w-6 text-right shrink-0">{i + 1}.</span>
                        <img src={avatarUrl(person.name)} alt={person.name} className="w-8 h-8 rounded-full bg-muted shrink-0" />
                        <span className="font-medium">{person.name}</span>
                        <span className="text-sm font-bold" style={{ color: PALETTE[i] ?? PALETTE[PALETTE.length - 1] }}>
                          {person.score} pkt
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(person)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(person.id, person.name)}>
                          <Trash2 className="h-3.5 w-3.5 text-red-400" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
