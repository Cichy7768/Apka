import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

const SCALE_OPTIONS    = ['E', 'D', 'C', 'B', 'A', 'S', 'SS']
const TAK_NIE          = ['Tak', 'Nie']
const PRACUJE_OPTIONS  = ['Tak', 'Nie', 'Part time']
const PSYCHICZNA_OPT   = ['Tak', 'Nie', 'Pozytywnie']
const WSPOLNE_OPTIONS  = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4+' },
]

const SELECT_FIELDS = [
  { label: 'Wygląd',        field: 'wyglad',        options: SCALE_OPTIONS },
  { label: 'Inteligencja',  field: 'inteligencja',  options: SCALE_OPTIONS },
  { label: 'Pracuje',       field: 'pracuje',        options: PRACUJE_OPTIONS },
  { label: 'Studiuje',      field: 'studiuje',       options: PRACUJE_OPTIONS },
  { label: 'ADHD',          field: 'adhd',           options: TAK_NIE },
  { label: 'Autyzm',        field: 'autyzm',         options: TAK_NIE },
  { label: 'Dystans i luz', field: 'dystans_i_luz',  options: TAK_NIE },
]

const EMPTY = {
  name: '', wyglad: '', pracuje: '', studiuje: '', adhd: '',
  autyzm: '', psychiczna: '', wspolne_tematy: '', zabawna: '',
  dystans_i_luz: '', inteligencja: '', wiek: '',
}

export default function PersonForm({ person, onSave, onClose }) {
  const [form, setForm] = useState(
    person
      ? { ...person, wspolne_tematy: String(person.wspolne_tematy ?? ''), zabawna: String(person.zabawna ?? ''), wiek: String(person.wiek ?? '') }
      : EMPTY
  )
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const data = {
      name:           form.name,
      wyglad:         form.wyglad         || null,
      pracuje:        form.pracuje        || null,
      studiuje:       form.studiuje       || null,
      adhd:           form.adhd           || null,
      autyzm:         form.autyzm         || null,
      psychiczna:     form.psychiczna     || null,
      wspolne_tematy: form.wspolne_tematy ? Number(form.wspolne_tematy) : null,
      zabawna:        form.zabawna        ? Number(form.zabawna)        : null,
      dystans_i_luz:  form.dystans_i_luz  || null,
      inteligencja:   form.inteligencja   || null,
      wiek:           form.wiek           ? Number(form.wiek)           : null,
    }

    const result = person?.id
      ? await supabase.from('persons').update(data).eq('id', person.id)
      : await supabase.from('persons').insert(data)

    if (result.error) {
      setError(result.error.message)
    } else {
      onSave()
    }
    setLoading(false)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{person?.id ? 'Edytuj osobę' : 'Dodaj osobę'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">

            <div className="col-span-2 space-y-2">
              <Label>Imię / Nick *</Label>
              <Input value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Imię" />
            </div>

            <div className="space-y-2">
              <Label>Wiek (20–30)</Label>
              <Input type="number" min={20} max={30} value={form.wiek} onChange={e => set('wiek', e.target.value)} placeholder="25" />
            </div>

            <div className="space-y-2">
              <Label>Zabawna (1–10)</Label>
              <Input type="number" min={1} max={10} value={form.zabawna} onChange={e => set('zabawna', e.target.value)} placeholder="7" />
            </div>

            {SELECT_FIELDS.map(({ label, field, options }) => (
              <div key={field} className="space-y-2">
                <Label>{label}</Label>
                <Select value={form[field]} onValueChange={v => set(field, v)}>
                  <SelectTrigger><SelectValue placeholder="Wybierz..." /></SelectTrigger>
                  <SelectContent>
                    {options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ))}

            <div className="space-y-2">
              <Label>Psychiczna</Label>
              <Select value={form.psychiczna} onValueChange={v => set('psychiczna', v)}>
                <SelectTrigger><SelectValue placeholder="Wybierz..." /></SelectTrigger>
                <SelectContent>
                  {PSYCHICZNA_OPT.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Wspólne tematy</Label>
              <Select value={form.wspolne_tematy} onValueChange={v => set('wspolne_tematy', v)}>
                <SelectTrigger><SelectValue placeholder="Wybierz..." /></SelectTrigger>
                <SelectContent>
                  {WSPOLNE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

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
