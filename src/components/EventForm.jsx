import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'

const EMPTY = { person_id: '', title: '', date: '', notes: '' }

export default function EventForm({ event, onSave, onClose }) {
  const [form, setForm]     = useState(event ? { ...event, date: event.date ? event.date.slice(0, 16) : '' } : EMPTY)
  const [persons, setPersons] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    supabase.from('persons').select('id, name').order('name').then(({ data }) => {
      if (data) setPersons(data)
    })
  }, [])

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const data = {
      person_id: form.person_id || null,
      title:     form.title,
      date:      form.date ? new Date(form.date).toISOString() : null,
      notes:     form.notes || null,
    }

    const result = event?.id
      ? await supabase.from('events').update(data).eq('id', event.id)
      : await supabase.from('events').insert(data)

    if (result.error) {
      setError(result.error.message)
    } else {
      onSave()
    }
    setLoading(false)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{event?.id ? 'Edytuj wydarzenie' : 'Dodaj wydarzenie'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="space-y-2">
            <Label>Osoba</Label>
            <Select value={form.person_id} onValueChange={v => set('person_id', v)}>
              <SelectTrigger><SelectValue placeholder="Wybierz osobę..." /></SelectTrigger>
              <SelectContent>
                {persons.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tytuł *</Label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} required placeholder="np. Randka w kawiarni" />
          </div>

          <div className="space-y-2">
            <Label>Data i godzina *</Label>
            <Input type="datetime-local" value={form.date} onChange={e => set('date', e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label>Notatki</Label>
            <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Opcjonalne notatki..." rows={3} />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Anuluj</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Zapisywanie...' : 'Zapisz'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
