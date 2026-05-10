import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { calculateScore } from '@/lib/scoring'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Button } from './ui/button'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import PersonForm from './PersonForm'

const COLUMNS = [
  { key: 'wyglad',        label: 'Wygląd' },
  { key: 'inteligencja',  label: 'Intel.' },
  { key: 'wiek',          label: 'Wiek' },
  { key: 'pracuje',       label: 'Pracuje' },
  { key: 'studiuje',      label: 'Studiuje' },
  { key: 'adhd',          label: 'ADHD' },
  { key: 'autyzm',        label: 'Autyzm' },
  { key: 'psychiczna',    label: 'Psychiczna' },
  { key: 'wspolne_tematy',label: 'Tematy' },
  { key: 'zabawna',       label: 'Zabawna' },
  { key: 'dystans_i_luz', label: 'Luz' },
  { key: 'zajawki',       label: '⚡ Zajawki' },
]

const ZAJAWKI_EMOJI = { 1: '😐', 2: '🙂', 3: '😊', 4: '🔥', 5: '🔥🔥' }

const avatarUrl = (name) =>
  `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&gender=female`

function scoreChip(score) {
  let cls = 'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-bold '
  if (score >= 60) cls += 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  else if (score >= 40) cls += 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  else if (score >= 20) cls += 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  else cls += 'bg-red-500/20 text-red-400 border-red-500/30'
  return <span className={cls}>{score}</span>
}

function displayVal(key, value) {
  if (value === null || value === undefined) return <span className="text-muted-foreground">—</span>
  if (key === 'wspolne_tematy') return value >= 4 ? '4+' : value
  if (key === 'zajawki') return ZAJAWKI_EMOJI[value] ? `${ZAJAWKI_EMOJI[value]} ${value}` : value
  return value
}

export default function PersonsTable() {
  const [persons, setPersons]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editPerson, setEditPerson] = useState(null)

  const fetchPersons = async () => {
    setLoading(true)
    const { data } = await supabase.from('persons').select('*').order('created_at', { ascending: false })
    setPersons(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchPersons() }, [])

  const handleDelete = async (id) => {
    if (!confirm('Na pewno usunąć tę osobę?')) return
    await supabase.from('persons').delete().eq('id', id)
    fetchPersons()
  }

  const handleSave = () => {
    setFormOpen(false)
    setEditPerson(null)
    fetchPersons()
  }

  if (loading) return <div className="flex justify-center py-20 text-muted-foreground">Ładowanie...</div>

  return (
    <div className="space-y-4 w-full min-w-0">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Osoby ({persons.length})</h2>
        <Button size="sm" onClick={() => { setEditPerson(null); setFormOpen(true) }}>
          <Plus className="mr-1 h-4 w-4" /> Dodaj osobę
        </Button>
      </div>

      {formOpen && (
        <PersonForm
          person={editPerson}
          onSave={handleSave}
          onClose={() => { setFormOpen(false); setEditPerson(null) }}
        />
      )}

      <div className="w-full rounded-lg border overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[860px] caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50">
                <th className="sticky left-0 bg-card z-10 w-[110px] px-3 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap shadow-[1px_0_0_0_hsl(var(--border))]">Imię</th>
                {COLUMNS.map(c => (
                  <th key={c.key} className="px-3 py-3 text-center text-xs font-medium text-muted-foreground whitespace-nowrap">{c.label}</th>
                ))}
                <th className="px-3 py-3 text-center text-xs font-medium text-muted-foreground whitespace-nowrap">Wynik</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-muted-foreground whitespace-nowrap">Akcje</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {persons.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length + 3} className="text-center text-muted-foreground py-16">
                    Brak osób. Kliknij "Dodaj osobę" aby zacząć.
                  </td>
                </tr>
              ) : (
                persons.map(person => (
                  <tr key={person.id} className="border-b transition-colors hover:bg-muted/30">
                    <td className="sticky left-0 bg-background z-10 px-3 py-2.5 font-medium whitespace-nowrap shadow-[1px_0_0_0_hsl(var(--border))]">
                      <div className="flex items-center gap-2">
                        <img
                          src={avatarUrl(person.name)}
                          alt={person.name}
                          className="w-8 h-8 rounded-full bg-muted shrink-0"
                        />
                        {person.name}
                      </div>
                    </td>
                    {COLUMNS.map(c => (
                      <td key={c.key} className="px-3 py-2.5 text-center whitespace-nowrap text-sm">
                        {displayVal(c.key, person[c.key])}
                      </td>
                    ))}
                    <td className="px-3 py-2.5 text-center">{scoreChip(calculateScore(person))}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditPerson(person); setFormOpen(true) }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(person.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-red-400" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
