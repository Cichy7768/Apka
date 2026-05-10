import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Button } from './components/ui/button'
import RankingChart from './components/RankingChart'
import EventsModule from './components/EventsModule'
import PersonsTable from './components/PersonsTable'
import AdminLogin from './components/AdminLogin'
import { Lock, LogOut, Heart } from 'lucide-react'

export default function App() {
  const [session, setSession]     = useState(null)
  const [showLogin, setShowLogin] = useState(false)
  const [activeTab, setActiveTab] = useState('ranking')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session) setActiveTab('ranking')
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setActiveTab('ranking')
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-background/95 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-5xl">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />
            <span className="font-bold text-lg tracking-tight">Personal CRM</span>
          </div>

          {session ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground hidden sm:block">{session.user.email}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-1" /> Wyloguj
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="icon" onClick={() => setShowLogin(true)} title="Panel admina">
              <Lock className="h-4 w-4" />
            </Button>
          )}
        </div>
      </header>

      {showLogin && !session && (
        <AdminLogin
          onSuccess={() => setShowLogin(false)}
          onClose={() => setShowLogin(false)}
        />
      )}

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="ranking">Ranking</TabsTrigger>
            <TabsTrigger value="wydarzenia">Wydarzenia</TabsTrigger>
            {session && <TabsTrigger value="osoby">Osoby</TabsTrigger>}
          </TabsList>

          <TabsContent value="ranking">
            <RankingChart session={session} />
          </TabsContent>

          <TabsContent value="wydarzenia">
            <EventsModule session={session} />
          </TabsContent>

          {session && (
            <TabsContent value="osoby">
              <PersonsTable />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  )
}
