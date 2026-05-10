import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Calendar, Plus, Pencil, Trash2, Clock } from 'lucide-react'
import EventForm from './EventForm'

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('pl-PL', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function timeUntil(dateStr) {
  const diff = new Date(dateStr) - new Date()
  if (diff < 0) return 'Minęło'
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (d > 0) return `Za ${d}d ${h}h`
  if (h > 0) return `Za ${h}h ${m}min`
  return `Za ${m} min`
}

export default function EventsModule({ session }) {
  const [events, setEvents]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editEvent, setEditEvent] = useState(null)

  const fetchEvents = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('events')
      .select('*, persons(name)')
      .order('date', { ascending: true })
    setEvents(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchEvents() }, [])

  const now      = new Date()
  const upcoming = events.filter(e => new Date(e.date) >= now)
  const past     = events.filter(e => new Date(e.date) < now)
  const nearest  = upcoming[0]

  const handleDelete = async (id) => {
    if (!confirm('Usunąć to wydarzenie?')) return
    await supabase.from('events').delete().eq('id', id)
    fetchEvents()
  }

  const handleSave = () => {
    setFormOpen(false)
    setEditEvent(null)
    fetchEvents()
  }

  if (loading) return <div className="flex justify-center py-20 text-muted-foreground">Ładowanie...</div>

  return (
    <div className="space-y-6">
      {session && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { setEditEvent(null); setFormOpen(true) }}>
            <Plus className="mr-1 h-4 w-4" /> Dodaj wydarzenie
          </Button>
        </div>
      )}

      {formOpen && (
        <EventForm
          event={editEvent}
          onSave={handleSave}
          onClose={() => { setFormOpen(false); setEditEvent(null) }}
        />
      )}

      {/* Najbliższe wydarzenie — widoczne publicznie */}
      {nearest ? (
        <Card className="border-violet-500/30 bg-violet-500/5">
          <CardHeader>
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              Najbliższe wydarzenie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold">{nearest.title}</h3>
                {nearest.persons?.name && (
                  <p className="text-muted-foreground mt-1">z <span className="text-foreground font-medium">{nearest.persons.name}</span></p>
                )}
                <p className="text-sm text-muted-foreground mt-2 capitalize">{formatDate(nearest.date)}</p>
                {nearest.notes && <p className="text-sm mt-3 italic text-muted-foreground">{nearest.notes}</p>}
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center gap-1.5 text-violet-400 font-semibold whitespace-nowrap">
                  <Clock className="h-4 w-4" />
                  {timeUntil(nearest.date)}
                </div>
                {session && (
                  <div className="flex gap-1 mt-2 justify-end">
                    <Button variant="ghost" size="icon" onClick={() => { setEditEvent(nearest); setFormOpen(true) }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(nearest.id)}>
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            <Calendar className="h-14 w-14 opacity-20" />
            <p>Brak zaplanowanych wydarzeń</p>
          </CardContent>
        </Card>
      )}

      {/* Admin: wszystkie nadchodzące */}
      {session && upcoming.length > 1 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
            Pozostałe nadchodzące ({upcoming.length - 1})
          </p>
          <div className="space-y-2">
            {upcoming.slice(1).map(event => (
              <Card key={event.id}>
                <CardContent className="py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{event.title}</p>
                    {event.persons?.name && <p className="text-sm text-muted-foreground">z {event.persons.name}</p>}
                    <p className="text-xs text-muted-foreground mt-0.5 capitalize">{formatDate(event.date)}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => { setEditEvent(event); setFormOpen(true) }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(event.id)}>
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Admin: minione */}
      {session && past.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 mt-4">
            Minione ({past.length})
          </p>
          <div className="space-y-2 opacity-40">
            {[...past].reverse().map(event => (
              <Card key={event.id}>
                <CardContent className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium line-through">{event.title}</p>
                    {event.persons?.name && <p className="text-sm text-muted-foreground">z {event.persons.name}</p>}
                    <p className="text-xs text-muted-foreground capitalize">{formatDate(event.date)}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(event.id)}>
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
