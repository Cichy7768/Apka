import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { calculateScore } from '@/lib/scoring'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Trophy } from 'lucide-react'

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

export default function RankingChart() {
  const [data, setData]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('persons').select('*').then(({ data: persons }) => {
      if (!persons) return
      const ranked = persons
        .map(p => ({ name: p.name, score: calculateScore(p) }))
        .sort((a, b) => b.score - a.score)
      setData(ranked)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="flex justify-center py-20 text-muted-foreground">Ładowanie...</div>

  if (data.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
      <Trophy className="h-14 w-14 opacity-20" />
      <p>Brak danych do wyświetlenia rankingu</p>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Podium top 3 */}
      {data.length >= 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {data.slice(0, 3).map((person, i) => (
            <Card key={person.name} className={i === 0 ? 'border-yellow-500/50 bg-yellow-500/5' : ''}>
              <CardContent className="pt-6 text-center">
                <div className="text-4xl mb-2">{MEDALS[i]}</div>
                <p className="font-bold text-lg leading-tight">{person.name}</p>
                <p className="text-3xl font-black mt-1" style={{ color: PALETTE[i] }}>{person.score}</p>
                <p className="text-xs text-muted-foreground">pkt</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pełny ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Ranking punktowy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={Math.max(280, data.length * 44)}>
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 48, left: 8, bottom: 0 }}>
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
                {data.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i] ?? PALETTE[PALETTE.length - 1]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
