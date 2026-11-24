# Wodyn × PICP – dziennik treningowy (8 tygodni)

Aplikacja webowa zbudowana na bazie arkusza *Plan Wodyn PICP – dziennik 8 tygodni*.
Plan PON A / WT C / CZW B, 56 serii tygodniowo (18 + 19 + 19), zapis kg / powtórzeń / RIR seria po serii, postępy tydzień do tygodnia.

## Program

| Dzień | Trening | Bloki | Serie |
|---|---|---|---:|
| Poniedziałek | **A** – przysiad · czworogłowe · barki | A przysiad · B1/B2 leg press + prostowanie nóg · C ściąganie drążka · D1/D2 unoszenie bokiem + reverse pec deck · E wspięcia na palce stojąc · F ab wheel | 18 |
| Wtorek | **C** – wyciskanie · góra ciała | A1/A2 wyciskanie leżąc + wiosłowanie z podparciem klatki · B1/B2 hantle skos + maszyna · C uginanie nóg siedząc · D triceps na wyciągu · E uginanie hantli na ławce skośnej | 19 |
| Czwartek | **B** – martwy ciąg · grzbiet | A martwy ciąg (4 serie) · B1/B2/B3 podciąganie neutralne + prostowanie ramion na wyciągu + wiosłowanie na wyciągu dolnym · C pec deck · D1/D2 przywodziciele + odwodziciele · E uginanie młotkowe | 19 |
| | | **Razem** | **56** |

Tydzień 1 to kalibracja (+1 RIR do celu), tydzień 4 kontrola zmęczenia, tydzień 8 ocena. Szczegóły (serie, powtórzenia, RIR, tempo, przerwy) są w zakładce **Plan** i w `src/plan.ts`.

Zmiany względem pierwotnego arkusza: we wtorek blok E to uginanie hantli na ławce skośnej zamiast wspięć na palce siedząc, a w czwartek martwy ciąg ma 4 serie zamiast 3 i zmieniono dobór ćwiczeń w blokach B3–E (blok D jest teraz dwuserią).

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

Zmiana planu (np. inne ćwiczenie) = edycja `src/plan.ts`. Wyniki są przypięte do identyfikatora ćwiczenia (np. `pon-B1`):

- **ten sam identyfikator** – zmiana nazwy lub zakresów zachowuje historię pod nową nazwą (tak zrobiono z wtorkowym `wt-E`),
- **nowy identyfikator** (`id` w definicji ćwiczenia) – gdy ćwiczenie jest naprawdę inne, żeby stare wyniki nie mieszały się z nowymi. Stare ćwiczenie dopisuje się do listy `RETIRED`: jego wyniki zostają w danych i w synchronizacji, są widoczne w **Postępy → Historia ćwiczenia → Archiwum** i w eksporcie CSV, ale nie liczą się do realizacji planu ani podpowiedzi progresji.

e1RM = ciężar × (1 + (powtórzenia + RIR) / 30) – orientacyjny trend, nie test 1RM (jak w arkuszu).
