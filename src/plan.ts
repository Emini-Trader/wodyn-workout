// Plan treningowy na bazie arkusza „Plan Wodyn PICP – dziennik 8 tygodni”.
// Zmiany względem arkusza: wtorek E (uginanie hantli na ławce skośnej zamiast łydek),
// czwartek B3–E (nowy dobór ćwiczeń, blok D jako dwuseria) – łącznie 55 serii tygodniowo.
// Wartości RIR to cele bazowe (tydzień 2–8). W tygodniu 1 (kalibracja) do celu dodajemy +1 RIR.

export type Mode = 'SOLO' | 'DWUSERIA' | 'TRÓJSERIA' | 'ANTAGONIŚCI'
export type DayId = 'pon' | 'wt' | 'czw'
export type MainLift = 'squat' | 'bench' | 'deadlift'

/** Przerwa: zakres w sekundach + etykieta jak w arkuszu */
export interface Rest {
  min: number
  max: number
  label: string
}

export interface Exercise {
  /** unikalny identyfikator slotu w planie, np. "pon-B1" */
  id: string
  code: string
  name: string
  sets: number
  reps: [number, number]
  rir: [number, number]
  tempo: string
  main?: MainLift
  /** ćwiczenie z masą ciała – kg opcjonalne */
  bodyweight?: boolean
}

export interface Block {
  letter: string
  title: string
  mode: Mode
  exercises: Exercise[]
  /** przerwa między ruchami w rundzie (dwuseria/trójseria/antagoniści) */
  between?: Rest
  /** przerwa między seriami (solo) lub między rundami */
  rest: Rest
  /** przerwa po ostatniej serii bloku, przed kolejnym blokiem (brak = koniec sesji) */
  transition?: Rest
}

export interface Day {
  id: DayId
  weekday: string
  short: string
  session: 'A' | 'B' | 'C'
  title: string
  /** dzień tygodnia JS (0 = niedziela) */
  jsDay: number
  blocks: Block[]
}

const r = (min: number, max: number, label: string): Rest => ({ min, max, label })

const ex = (
  day: DayId,
  code: string,
  name: string,
  sets: number,
  reps: [number, number],
  rir: [number, number],
  tempo: string,
  extra: Partial<Exercise> = {},
): Exercise => ({ id: `${day}-${code}`, code, name, sets, reps, rir, tempo, ...extra })

export const DAYS: Day[] = [
  {
    id: 'pon',
    weekday: 'Poniedziałek',
    short: 'PON',
    session: 'A',
    title: 'Przysiad · czworogłowe · barki',
    jsDay: 1,
    blocks: [
      {
        letter: 'A',
        title: 'Ciężkie przysiady',
        mode: 'SOLO',
        exercises: [ex('pon', 'A', 'Przysiad ze sztangą', 4, [3, 5], [2, 3], '20X0', { main: 'squat' })],
        rest: r(180, 240, '3–4 min'),
        transition: r(120, 180, '2–3 min'),
      },
      {
        letter: 'B',
        title: 'Czworogłowe',
        mode: 'DWUSERIA',
        exercises: [
          ex('pon', 'B1', 'Leg press', 2, [8, 12], [2, 3], '2010'),
          ex('pon', 'B2', 'Prostowanie nóg na maszynie', 2, [10, 15], [1, 2], '2010'),
        ],
        between: r(10, 15, '10–15 s'),
        rest: r(120, 180, '2–3 min'),
        transition: r(120, 120, '2 min'),
      },
      {
        letter: 'C',
        title: 'Plecy – uzupełnienie',
        mode: 'SOLO',
        exercises: [ex('pon', 'C', 'Ściąganie drążka wyciągu górnego', 2, [8, 12], [2, 2], '2010')],
        rest: r(90, 120, '90–120 s'),
        transition: r(90, 120, '90–120 s'),
      },
      {
        letter: 'D',
        title: 'Barki – akton boczny i tylny',
        mode: 'DWUSERIA',
        exercises: [
          ex('pon', 'D1', 'Unoszenie ramion bokiem', 2, [12, 15], [1, 2], '2010'),
          ex('pon', 'D2', 'Reverse pec deck', 2, [12, 15], [1, 2], '2010'),
        ],
        between: r(10, 15, '10–15 s'),
        rest: r(90, 120, '90–120 s'),
        transition: r(90, 90, '90 s'),
      },
      {
        letter: 'E',
        title: 'Łydki',
        mode: 'SOLO',
        exercises: [ex('pon', 'E', 'Wspięcia na palce stojąc', 2, [12, 15], [1, 2], '2011')],
        rest: r(60, 90, '60–90 s'),
        transition: r(60, 90, '60–90 s'),
      },
      {
        letter: 'F',
        title: 'Core',
        mode: 'SOLO',
        exercises: [
          ex('pon', 'F', 'Ab wheel / ćwiczenie brzucha', 2, [8, 12], [2, 2], 'kontrolowane', { bodyweight: true }),
        ],
        rest: r(60, 90, '60–90 s'),
      },
    ],
  },
  {
    id: 'wt',
    weekday: 'Wtorek',
    short: 'WT',
    session: 'C',
    title: 'Wyciskanie · góra ciała',
    jsDay: 2,
    blocks: [
      {
        letter: 'A',
        title: 'Para antagonistyczna: pchanie / przyciąganie',
        mode: 'ANTAGONIŚCI',
        exercises: [
          ex('wt', 'A1', 'Wyciskanie sztangi leżąc', 4, [3, 5], [2, 3], '21X0', { main: 'bench' }),
          ex('wt', 'A2', 'Wiosłowanie z podparciem klatki', 4, [6, 8], [2, 2], '2010'),
        ],
        between: r(90, 120, '90–120 s'),
        rest: r(90, 120, '90–120 s'),
        transition: r(120, 180, '2–3 min'),
      },
      {
        letter: 'B',
        title: 'Klatka – składanka hipertroficzna',
        mode: 'DWUSERIA',
        exercises: [
          ex('wt', 'B1', 'Wyciskanie hantli na skosie dodatnim', 2, [8, 10], [2, 2], '2010'),
          ex('wt', 'B2', 'Wyciskanie na maszynie poziomo', 2, [10, 12], [1, 2], '2010'),
        ],
        between: r(10, 15, '10–15 s'),
        rest: r(120, 180, '2–3 min'),
        transition: r(120, 120, '2 min'),
      },
      {
        letter: 'C',
        title: 'Mięśnie kulszowo-goleniowe',
        mode: 'SOLO',
        exercises: [ex('wt', 'C', 'Uginanie nóg siedząc', 3, [8, 12], [1, 2], '2010')],
        rest: r(90, 120, '90–120 s'),
        transition: r(90, 90, '90 s'),
      },
      {
        letter: 'D',
        title: 'Triceps',
        mode: 'SOLO',
        exercises: [ex('wt', 'D', 'Prostowanie ramion na triceps (wyciąg)', 2, [10, 12], [1, 2], '2010')],
        rest: r(60, 90, '60–90 s'),
        transition: r(90, 90, '90 s'),
      },
      {
        letter: 'E',
        title: 'Biceps',
        mode: 'SOLO',
        exercises: [ex('wt', 'E', 'Uginanie hantli na ławce skośnej', 2, [8, 12], [1, 2], '3010')],
        rest: r(90, 90, '90 s'),
      },
    ],
  },
  {
    id: 'czw',
    weekday: 'Czwartek',
    short: 'CZW',
    session: 'B',
    title: 'Martwy ciąg · grzbiet',
    jsDay: 4,
    blocks: [
      {
        letter: 'A',
        title: 'Ciężki martwy ciąg',
        mode: 'SOLO',
        exercises: [ex('czw', 'A', 'Martwy ciąg klasyczny', 3, [3, 5], [2, 3], 'reset', { main: 'deadlift' })],
        rest: r(180, 240, '3–4 min'),
        transition: r(120, 180, '2–3 min'),
      },
      {
        letter: 'B',
        title: 'Grzbiet – składanka Wodyna',
        mode: 'TRÓJSERIA',
        exercises: [
          // ten sam slot co wcześniejsze „Podciąganie lub wyciąg górny” – historia zostaje
          ex('czw', 'B1', 'Podciąganie chwytem neutralnym', 2, [6, 10], [2, 2], '2010', { bodyweight: true }),
          ex('czw', 'B2', 'Prostowanie ramion na wyciągu', 2, [10, 12], [1, 2], '2010'),
          // nowe ćwiczenie → nowy identyfikator (stare czw-B3 to wiosłowanie z podparciem klatki)
          ex('czw', 'B3', 'Wiosłowanie siedząc na wyciągu dolnym', 2, [8, 12], [1, 2], '2010', { id: 'czw-B3-wyciag' }),
        ],
        between: r(10, 15, '10–15 s'),
        rest: r(120, 180, '2–3 min'),
        transition: r(120, 120, '2 min'),
      },
      {
        letter: 'C',
        title: 'Klatka – izolacja',
        mode: 'SOLO',
        exercises: [ex('czw', 'C', 'Pec Deck / rozpiętki na maszynie', 3, [10, 12], [1, 2], '3010', { id: 'czw-C-pecdeck' })],
        rest: r(90, 120, '90–120 s'),
        transition: r(120, 120, '2 min'),
      },
      {
        letter: 'D',
        title: 'Przywodziciele i odwodziciele biodra',
        mode: 'DWUSERIA',
        exercises: [
          ex('czw', 'D1', 'Przywodziciele siedząc na maszynie', 2, [12, 15], [1, 2], '2010'),
          ex('czw', 'D2', 'Odwodziciele siedząc na maszynie', 2, [12, 15], [1, 2], '2010'),
        ],
        between: r(10, 15, '10–15 s'),
        rest: r(90, 120, '90–120 s'),
        transition: r(90, 90, '90 s'),
      },
      {
        letter: 'E',
        title: 'Biceps i mięsień ramienny',
        mode: 'SOLO',
        exercises: [ex('czw', 'E', 'Uginanie młotkowe hantlami', 2, [8, 12], [1, 2], '3010', { id: 'czw-E-mlotkowe' })],
        rest: r(90, 90, '90 s'),
      },
    ],
  },
]

export const WEEKS = 8

/**
 * Ćwiczenia usunięte z planu. Ich zapisane wyniki zostają w danych (nie są kasowane ani przypisywane
 * nowym ćwiczeniom) – są widoczne w historii na ekranie Postępy i w eksporcie CSV,
 * ale nie liczą się do realizacji bieżącego planu ani do podpowiedzi progresji.
 */
export const RETIRED: (Exercise & { day: DayId })[] = [
  { ...ex('czw', 'B3', 'Wiosłowanie z podparciem klatki', 2, [8, 12], [1, 2], '2010'), day: 'czw' },
  { ...ex('czw', 'C', 'Wyciskanie hantli na skosie dodatnim', 3, [8, 10], [2, 2], '2010'), day: 'czw' },
  { ...ex('czw', 'D', 'Uginanie nóg siedząc', 3, [8, 12], [1, 2], '2010'), day: 'czw' },
  { ...ex('czw', 'E', 'Uginanie ramion na biceps', 2, [8, 12], [1, 2], '2010'), day: 'czw' },
]

export interface WeekInfo {
  n: number
  phase: string
  hint: string
  rirBonus: number
}

export const WEEK_INFO: WeekInfo[] = Array.from({ length: WEEKS }, (_, i) => {
  const n = i + 1
  if (n === 1)
    return { n, phase: 'Kalibracja', hint: 'Dodaj 1 RIR do celu. Szukasz ciężarów roboczych, nie rekordów.', rirBonus: 1 }
  if (n === 4)
    return {
      n,
      phase: 'Kontrola zmęczenia',
      hint: 'Oceń regenerację. Jeśli zmęczenie się kumuluje, utrzymaj ciężary i opisz to w uwagach.',
      rirBonus: 0,
    }
  if (n === 8)
    return { n, phase: 'Ocena', hint: 'Ostatni tydzień – porównaj wyniki z tygodniem 1 w zakładce Postępy.', rirBonus: 0 }
  return {
    n,
    phase: 'Progresja',
    hint: 'Po górnym zakresie powtórzeń we wszystkich seriach przy celu RIR – dołóż ciężar.',
    rirBonus: 0,
  }
})

export const MODE_INFO: Record<Mode, { label: string; how: string }> = {
  SOLO: { label: 'Solo', how: 'Wszystkie serie jednego ćwiczenia po kolei.' },
  DWUSERIA: { label: 'Dwuseria', how: 'Ruch 1 → 10–15 s → ruch 2 → dłuższa przerwa → kolejna runda.' },
  TRÓJSERIA: { label: 'Trójseria', how: 'Ruch 1 → 10–15 s → ruch 2 → 10–15 s → ruch 3 → dłuższa przerwa → kolejna runda.' },
  ANTAGONIŚCI: { label: 'Antagoniści', how: 'A1 → 90–120 s → A2 → 90–120 s → A1. Utrzymuj wysoką jakość.' },
}

export const MAIN_LIFTS: { id: MainLift; name: string; day: DayId; exId: string }[] = [
  { id: 'squat', name: 'Przysiad', day: 'pon', exId: 'pon-A' },
  { id: 'bench', name: 'Wyciskanie leżąc', day: 'wt', exId: 'wt-A1' },
  { id: 'deadlift', name: 'Martwy ciąg', day: 'czw', exId: 'czw-A' },
]

export const dayById = (id: DayId) => DAYS.find((d) => d.id === id)!

export const allExercises = (): (Exercise & { day: Day; block: Block })[] =>
  DAYS.flatMap((day) => day.blocks.flatMap((block) => block.exercises.map((e) => ({ ...e, day, block }))))

export const setsInDay = (day: Day) => day.blocks.reduce((s, b) => s + b.exercises.reduce((a, e) => a + e.sets, 0), 0)

export const SETS_PER_WEEK = DAYS.reduce((s, d) => s + setsInDay(d), 0)

export const rirTarget = (e: Exercise, week: number): [number, number] => {
  const bonus = WEEK_INFO[week - 1]?.rirBonus ?? 0
  return [e.rir[0] + bonus, e.rir[1] + bonus]
}

export const fmtRange = ([a, b]: [number, number]) => (a === b ? `${a}` : `${a}–${b}`)
