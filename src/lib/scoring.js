const SCALE    = { E: 1, D: 2, C: 4, B: 6, A: 8, S: 9, SS: 10 }
const PRACUJE  = { Tak: 8, 'Part time': 5, Nie: 2 }
const STUDIUJE = { Tak: 8, 'Part time': 5, Nie: 2 }
const ADHD     = { Nie: 0, Tak: -3 }
const AUTYZM   = { Nie: 0, Tak: -3 }
const PSYCHICZNA = { Pozytywnie: 2, Nie: 0, Tak: -5 }
const WSPOLNE  = { 1: 2, 2: 5, 3: 8, 4: 10 }
const DYSTANS  = { Tak: 5, Nie: 0 }

export function ageMultiplier(age) {
  const a = Number(age)
  if (!a || a < 20 || a > 30) return 1
  return 1 + (30 - a) * 0.025
}

export function calculateScore(person) {
  let sum = 0
  sum += SCALE[person.wyglad]          ?? 0
  sum += PRACUJE[person.pracuje]       ?? 0
  sum += STUDIUJE[person.studiuje]     ?? 0
  sum += ADHD[person.adhd]             ?? 0
  sum += AUTYZM[person.autyzm]         ?? 0
  sum += PSYCHICZNA[person.psychiczna] ?? 0
  sum += WSPOLNE[Math.min(Number(person.wspolne_tematy) || 0, 4)] ?? 0
  sum += Number(person.zabawna)        || 0
  sum += DYSTANS[person.dystans_i_luz] ?? 0
  sum += SCALE[person.inteligencja]    ?? 0

  return Math.round(sum * ageMultiplier(person.wiek) * 10) / 10
}
