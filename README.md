# Wodyn × PICP – dziennik treningowy (8 tygodni)

Aplikacja webowa zbudowana na bazie arkusza *Plan Wodyn PICP – dziennik 8 tygodni*.
Plan PON A / WT C / CZW B, 54 serie tygodniowo, zapis kg / powtórzeń / RIR seria po serii, postępy tydzień do tygodnia.

## Co jest w środku

| Zakładka | Do czego |
|---|---|
| **Trening** | Otwiera się od razu na następnym treningu do zrobienia. Wybór tygodnia (1–8) i dnia (PON A / WT C / CZW B), „Plan dnia” w skrócie, bloki z seriami do wpisania. |
| **Plan** | Cały plan tygodnia czytelnie, blokami, z przerwami. Przełącznik celów RIR: tydzień 1 (kalibracja, +1 RIR) i tygodnie 2–8. |
| **Postępy** | Wykresy e1RM i maks. ciężaru dla przysiadu, wyciskania i martwego ciągu, realizacja planu, tabela tygodni, historia dowolnego ćwiczenia. |
| **Zasady** | Tryby (solo / dwuseria / trójseria / antagoniści), RIR, progresja, tempo, periodyzacja, kopia danych, synchronizacja. |

Ułatwienia w trakcie treningu:

- **Podpowiedzi w polach** – szare wartości to poprzednia seria z dzisiaj albo ta sama seria z poprzedniego tygodnia.
  Przycisk **✓** w pustym wierszu przyjmuje podpowiedź jednym dotknięciem.
- **Minutnik przerwy** – ✓ uruchamia odliczanie właściwej przerwy (np. 10–15 s → B2, 2–3 min → runda 2, 2 min → blok C), z sygnałem dźwiękowym/wibracją.
- **Znacznik „Dołóż ciężar”** – gdy w ostatnim zapisanym tygodniu wszystkie serie trafiły w górny zakres powtórzeń przy celu RIR (reguła progresji z arkusza).
- **Historia ćwiczenia** – ikona zegara przy ćwiczeniu pokazuje wyniki ze wszystkich tygodni.
- Data treningu ustawia się sama przy pierwszej zapisanej serii, uwagi po treningu na dole.
- Działa offline (PWA) – na telefonie „Udostępnij → Dodaj do ekranu początkowego”.

## Uruchomienie lokalnie

```bash
npm install
```

```bash
npm run dev
```

## Deploy na Vercel

1. Wypchnij repozytorium na GitHub i w Vercelu wybierz **Add New → Project → Import** tego repozytorium.
2. Framework zostanie wykryty jako **Vite** (build `npm run build`, katalog `dist`) – nic nie trzeba zmieniać. **Deploy**.

To wystarczy: dane zapisują się w przeglądarce (localStorage). W zakładce **Zasady** jest eksport kopii (JSON / CSV) i import.

### Opcjonalnie: synchronizacja telefon ↔ komputer

Żeby mieć te same dane na kilku urządzeniach:

1. W projekcie na Vercelu: **Storage → Marketplace → Upstash (Redis) → Create / Connect**.
   Integracja sama doda zmienne `<PREFIKS>_REST_API_URL` i `<PREFIKS>_REST_API_TOKEN` (prefiks może być dowolny, np. `KV` lub domyślny `STORAGE`).
2. **Settings → Environment Variables** → dodaj `SYNC_SECRET` z dowolnym długim hasłem.
3. Zrób **Redeploy**.
4. W aplikacji: **Zasady → Synchronizacja** → wpisz to samo hasło na każdym urządzeniu.

Zmiany są wysyłane automatycznie kilka sekund po wpisaniu wyniku i pobierane przy każdym otwarciu aplikacji.
Konflikty są scalane seria po serii (wygrywa nowsza zmiana), więc wpisy z dwóch urządzeń się nie nadpisują.

## Struktura

```
src/plan.ts          – plan treningowy (ćwiczenia, serie, zakresy, RIR, tempo, przerwy)
src/store.ts         – zapis danych + scalanie przy synchronizacji
src/logic.ts         – e1RM, statystyki, progresja, przerwy, eksport CSV
src/sync.ts          – klient synchronizacji
src/components/      – widoki
api/sync.ts          – Vercel Function (Upstash Redis)
```

Zmiana planu (np. inne ćwiczenie) = edycja `src/plan.ts`. Wyniki są przypięte do identyfikatora slotu (np. `pon-B1`), więc zmiana nazwy ćwiczenia nie kasuje historii.

e1RM = ciężar × (1 + (powtórzenia + RIR) / 30) – orientacyjny trend, nie test 1RM (jak w arkuszu).
