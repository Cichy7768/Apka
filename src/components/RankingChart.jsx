import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { calculateScore } from '@/lib/scoring'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Trophy, Plus, Pencil, Trash2 } from 'lucide-react'
import PersonForm from './PersonForm'

const PALETTE = [
  '#f59e0b', '#94a3b8', '#b45309',
  '#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#84cc16', '#f97316', '#06b6d4',
]

const MEDALS = ['🥇', '🥈', '🥉']

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

export default function RankingChart({ session }) {
  const [persons, setPersons]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editPerson, setEditPerson] = useState(null)

  const fetchPersons = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('persons').select('*')
    if (data) setPersons(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchPersons() }, [fetchPersons])

  const handleSave = () => {
    setFormOpen(false)
    setEditPerson(null)
    fetchPersons()
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Na pewno usunąć "${name}"?`)) return
    await supabase.from('persons').delete().eq('id', id)
    fetchPersons()
  }

  const openEdit = (person) => {
    setEditPerson(person)
    setFormOpen(true)
  }

  const ranked = [...persons]
    .map(p => ({ ...p, score: calculateScore(p) }))
    .sort((a, b) => b.score - a.score)

  const chartData = ranked.map(p => ({ name: p.name, score: p.score }))

  if (loading) return <div className="flex justify-center py-20 text-muted-foreground">Ładowanie...</div>

  return (
    <div className="space-y-6">

      {/* Przycisk dodawania — tylko dla admina */}
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
                  <CardContent className="pt-6 text-center relative">
                    {session && (
                      <div className="absolute top-2 right-2 flex gap-1">
                        <Button
                          variant="ghost" size="icon"
                          className="h-6 w-6 opacity-50 hover:opacity-100"
                          onClick={() => openEdit(person)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-6 w-6 opacity-50 hover:opacity-100"
                          onClick={() => handleDelete(person.id, person.name)}
                        >
                          <Trash2 className="h-3 w-3 text-red-400" />
                        </Button>
                      </div>
                    )}
                    <div className="text-4xl mb-2">{MEDALS[i]}</div>
                    <p className="font-bold text-lg leading-tight">{person.name}</p>
                    <p className="text-3xl font-black mt-1" style={{ color: PALETTE[i] }}>{person.score}</p>
                    <p className="text-xs text-muted-foreground">pkt</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Wykres */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Ranking punktowy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={Math.max(280, ranked.length * 44)}>
                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 48, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis
                    type="number"
                    domain={[0, 'auto']}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tick={{ fill: 'hsl(var(--foreground))', fontSize: 13 }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]} label={{ position: 'right', fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i] ?? PALETTE[PALETTE.length - 1]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Lista z akcjami — tylko dla admina */}
          {session && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground font-normal">Zarządzaj osobami</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {ranked.map((person, i) => (
                    <div key={person.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground text-sm w-6 text-right">{i + 1}.</span>
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
