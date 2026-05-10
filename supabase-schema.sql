-- ===========================================
--  Personal CRM — schemat bazy Supabase
--  Wklej całość do: Supabase → SQL Editor → Run
-- ===========================================

-- Tabela osób
CREATE TABLE IF NOT EXISTS public.persons (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  wyglad          text CHECK (wyglad         IN ('E','D','C','B','A','S','SS')),
  pracuje         text CHECK (pracuje         IN ('Tak','Nie','Part time')),
  studiuje        text CHECK (studiuje        IN ('Tak','Nie','Part time')),
  adhd            text CHECK (adhd            IN ('Tak','Nie')),
  autyzm          text CHECK (autyzm          IN ('Tak','Nie')),
  psychiczna      text CHECK (psychiczna      IN ('Tak','Nie','Pozytywnie')),
  wspolne_tematy  integer CHECK (wspolne_tematy BETWEEN 1 AND 4),
  zabawna         integer CHECK (zabawna      BETWEEN 1 AND 10),
  dystans_i_luz   text CHECK (dystans_i_luz   IN ('Tak','Nie')),
  inteligencja    text CHECK (inteligencja    IN ('E','D','C','B','A','S','SS')),
  wiek            integer CHECK (wiek         BETWEEN 20 AND 30),
  created_at      timestamptz DEFAULT now()
);

-- Tabela wydarzeń
CREATE TABLE IF NOT EXISTS public.events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id  uuid REFERENCES public.persons(id) ON DELETE SET NULL,
  title      text NOT NULL,
  date       timestamptz NOT NULL,
  notes      text,
  created_at timestamptz DEFAULT now()
);

-- Włącz Row Level Security
ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events  ENABLE ROW LEVEL SECURITY;

-- Publiczny odczyt (widoczny bez logowania)
CREATE POLICY "Publiczny odczyt persons"
  ON public.persons FOR SELECT USING (true);

CREATE POLICY "Publiczny odczyt events"
  ON public.events FOR SELECT USING (true);

-- Zapis tylko dla zalogowanego admina
CREATE POLICY "Admin zapis persons"
  ON public.persons FOR ALL
  USING       (auth.role() = 'authenticated')
  WITH CHECK  (auth.role() = 'authenticated');

CREATE POLICY "Admin zapis events"
  ON public.events FOR ALL
  USING       (auth.role() = 'authenticated')
  WITH CHECK  (auth.role() = 'authenticated');
