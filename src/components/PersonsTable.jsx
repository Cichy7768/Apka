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
]

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
    <div className="space-y-4">
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

      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-card z-10 min-w-[120px]">Imię</TableHead>
                {COLUMNS.map(c => (
                  <TableHead key={c.key} className="text-center whitespace-nowrap">{c.label}</TableHead>
                ))}
                <TableHead className="text-center">Wynik</TableHead>
                <TableHead className="text-center">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {persons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={COLUMNS.length + 3} className="text-center text-muted-foreground py-16">
                    Brak osób. Kliknij "Dodaj osobę" aby zacząć.
                  </TableCell>
                </TableRow>
              ) : (
                persons.map(person => (
                  <TableRow key={person.id}>
                    <TableCell className="font-medium sticky left-0 bg-background z-10 whitespace-nowrap">
                      {person.name}
                    </TableCell>
                    {COLUMNS.map(c => (
                      <TableCell key={c.key} className="text-center whitespace-nowrap">
                        {displayVal(c.key, person[c.key])}
                      </TableCell>
                    ))}
                    <TableCell className="text-center">{scoreChip(calculateScore(person))}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setEditPerson(person); setFormOpen(true) }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(person.id)}>
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
