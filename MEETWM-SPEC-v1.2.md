# MeetWM — Specifikacija
> Verzija: v1.2 | Datum: 27. jul 2026.

---

## 1. Project Identity

**Naziv:** MeetWM
**One-liner:** Chrome ekstenzija koja automatski beleži kada si ušao i izašao sa Google Meet poziva, i pravi hronološki log koji služi kao lična podsetnica pri logovanju sati u Tempo.

**Problem koji rešava:** Google Meet nema nikakav lak istorijski pregled — na kraju dana/nedelje nemoguće je tačno rekonstruisati koliko si vremena stvarno proveo na kom sastanku. Ekstenzija pravi tu istoriju automatski, u pozadini, bez ikakve akcije korisnika.

**Za koga:** Mali interni tim (isti krug kao JiraWM). Svaki korisnik ima svoj lokalni log — nema deljenja podataka između kolega, nema centralnog pregleda.

**Trenutna faza:** Pre-build. Ovaj dokument je ulazna specifikacija za prvi CC setup.

**Complexity estimate vs. QRKiosk:** ~0.1x. Ovo je namerno mali, jednonamenski alat — jedan content script, lokalni storage, dva UI ekrana. Nema backend-a, nema auth-a, nema multi-role logike.

**URLs:** TBD — repo, ime, distribucija preko GitHub-a (unpacked, ručni reload — isti model kao JiraWM).

---

## 2. Tehnički stack

| Sloj | Izbor | Zašto |
|---|---|---|
| Platforma | Chrome ekstenzija, Manifest V3 | Standard za novi rad |
| Jezik | TypeScript (strict) | Tip-sigurnost bez ozbiljnog overhead-a |
| UI | Vanilla TS + čist HTML/CSS, **bez React-a** | Popup i history stranica su liste sa par interakcija (expand/collapse, edit, export) — React bi dodao build pipeline i dependency tešinu bez stvarne potrebe |
| Build | Direktan `tsc` (bez bundlera) | Nema eksternih npm zavisnosti u kodu ekstenzije (`chrome.*` API je globalno preko `@types/chrome`) — bundler nema šta da spaja |
| Storage | `chrome.storage.local` | Sve lokalno, bez servera. Faza 1 ne treba multi-device niti tim-deljenje |
| Backend | Nema | Svesna odluka — vidi Key Decisions Log |
| Auth | Nema | Nema servera kome bi se autentifikovao |
| Distribucija | Unpacked iz GitHub repoa, ručni reload | Isti model kao JiraWM, zero friction za mali tim, bez Web Store review-a |

**Permissions (manifest):** `storage`, `activeTab`. Širi `tabs` permission nije potreban u Fazi 1 jer content script radi direktno na `meet.google.com` match pattern-u.

---

## 3. Data Model

### Session (osnovni entitet, uvek flat, nikad pre-agregiran)

```typescript
interface MeetingSession {
  id: string;              // uuid ili timestamp-based
  meetingCode: string;     // deo iz URL-a: meet.google.com/xxx-xxxx-xxx → "xxx-xxxx-xxx"
  startTime: number;       // epoch ms
  endTime: number | null;  // null = sesija nikad nije uredno zatvorena (crash/force quit)
  dateKey: string;         // "YYYY-MM-DD" izvedeno iz startTime, za brzo filtriranje po danu
  title: string | null;    // opciono, ručno unet naziv (tab title fallback ako postoji)
  projectTag: string | null; // opciono, za buduće Tempo mapiranje — nije obavezno polje u Fazi 1
}
```

**Ključno pravilo:** svaka sesija (join→leave) je svoj red, uvek. Nema auto-spajanja u samim podacima — isti `meetingCode` se legitimno može ponoviti više puta u danu (fiksni tim link koji se koristi za različite sastanke), pa spajanje na nivou podataka nije bezbedno. Grupisanje se radi isključivo u prikazu (vidi §5), iz iste deljene funkcije na oba mesta (popup i history), da ne postoje dve verzije logike grupisanja.

**Nezavršena sesija (`endTime: null`):** prikazuje se vizuelno flagovano (npr. "⚠ nezavršeno") umesto da se nagađa trajanje. Korisnik ručno ispravi taj red.

**Trajanje:** nikad se ne čuva kao poseban field — uvek se računa iz `startTime`/`endTime` u trenutku prikaza, u dva formata:
- `Xh Ym` (npr. `1h 27m`, ili samo `32m` kad je ispod sat vremena) — default prikaz u UI (čitljivije na prvi pogled od `H:MM`)
- decimalni sati (npr. `1.25`) — format za export/copy, jer je to format koji Tempo očekuje

---

## 4. Detekcija — content script logika

- Content script se učitava na `meet.google.com/*`
- **"In call" state** se detektuje preko DOM signala (npr. prisustvo "Leave call" dugmeta), ne preko toga da li je tab otvoren — otvoren tab na Meet lobby ekranu ≠ aktivna sesija
- Start sesije: trenutak kad se "in call" state prvi put detektuje
- Kraj sesije: trenutak kad "in call" signal nestane (leave dugme, zatvoren tab, navigacija sa stranice)
- **Poznat rizik:** Meet DOM selektori nisu stabilni garantovano — Google menja UI bez najave. Ovo nije "napravi jednom i zaboravi", zahteva povremenu proveru. Vidi §7.

---

## 5. UI Struktura

### Toolbar popup (klik na ikonicu)
- Mali prikaz, samo **danas**
- Accordion grupisan po `meetingCode`: header = sumarni red ("Team standup link — 3 sesije, 1:47"), expand = svaka sesija hronološki sa tačnim vremenima
- "More info →" link na dnu, vodi u history tab

### History stranica (novi tab, puna površina)
- Dan / nedelja / mesec pregled
- Isti accordion grupisan po `meetingCode`, ali sa filterima po periodu
- Ručna izmena pojedinačnih sesija (ispravka nezavršenih, dodavanje naziva/tag-a)
- Export dugme — CSV ili copy-to-clipboard u decimalnom satnom formatu, spremno za ručni unos u Tempo

Popup nema sopstvenu kompleksnu logiku — obe površine dele istu gruping/formatting funkciju iz `src/shared/`.

---

## 6. Feature Map po fazama

| Feature | Faza | Status |
|---|---|---|
| Detekcija join/leave na Meet (DOM signal) | 1 | Za build |
| Flat session log u `chrome.storage.local` | 1 | Za build |
| Popup: dnevni summary, accordion po `meetingCode` | 1 | Za build |
| History tab: dan/nedelja/mesec, filteri, ručna izmena | 1 | Za build |
| Export (CSV / copy decimalni sati) | 1 | Za build |
| Flagovanje nezavršenih sesija | 1 | Za build |
| Google Calendar integracija (auto-naslov, auto-tag) | 2 | Backlog |
| Cross-device sync (Supabase) | 2 | Backlog, opciono — samo ako se pokaže potreba |
| Tempo API direktan push | 3 | Backlog — zavisi od devops pristupa Tempo API-ju |
| Zoom / Teams podrška | — | Van scope-a, nije tražena |
| Praćenje ostalih učesnika sastanka | — | Odbačeno — vidi Key Decisions Log |

---

## 7. Key Decisions Log

| Odluka | Alternative | Zašto | Rizik |
|---|---|---|---|
| Prati se samo sopstvena sesija, ne i ostali učesnici | Praćenje vremena dolaska/odlaska svih učesnika | Meet DOM za People panel nema stabilne selektore, panel mora biti otvoren da bi se čitao, i funkcija lako sklizne u "nadzor nad kolegama" umesto ličnog alata | — |
| Flat hronološki log, grupisanje samo u prikazu | Auto-spajanje rejoin sesija u bazi na osnovu URL koda | Fiksni tim link se legitimno koristi više puta dnevno za različite sastanke — spajanje na nivou podataka bi bilo pogrešna pretpostavka | Ako se kasnije poželi "pametno" auto-spajanje, logika ide u prikaz, ne u storage |
| Nezavršene sesije se flaguju, ne nagađaju | Auto-računanje trajanja na osnovu poslednjeg poznatog signala | Nagađanje bi tiho unosilo pogrešne podatke u log koji se koristi za realno fakturisanje vremena | Korisnik mora ručno da ispravi — mali friction, ali tačnost je prioritet |
| Vanilla TS, bez React-a | React + Vite | UI je lista sa par interakcija — React dodaje build kompleksnost bez funkcionalne dobiti na ovoj skali | Ako popup preraste u nešto sa realnim state-om, razmotriti prelazak |
| Bez bundlera, čist `tsc` | Vite/esbuild | Nema eksternih zavisnosti u kodu — bundler nema šta da radi | Ako se doda npm zavisnost (npr. za CSV export), revizija odluke |
| Bez backend-a u Fazi 1 | Supabase od starta | Lokalni log rešava originalni problem bez ikakve infrastrukture; sync nije dokazano potreban | Ako više mašina po korisniku postane realan use case, razmotriti Fazu 2 |
| Tempo integracija odložena u Fazu 3 | Tempo push od starta | Tempo API pristup zavisi od devops/admin dozvole van Ognjenove kontrole — ne sme biti blocker za Fazu 1 | Faza 3 ne kreće dok se ne potvrdi da je Tempo API uopšte dostupan na planu |
| Distribucija: unpacked iz GitHub repoa | Chrome Web Store (unlisted) | Isti model kao JiraWM, zero friction za mali tim | Svaka nova verzija zahteva ručni reload kod svakog korisnika |
| Tier: Mikro (project-setup-standard) | Standard tier | Projekat je po definiciji primer Mikro tier-a iz standarda — interni alat, jedan konzument tipa po korisniku, nema baze | Ako Faza 2/3 dodaju backend i Tempo integraciju, tier se penje na Standard — svesna odluka, ne podrazumevana |
| Finalni naziv: MeetWM (radni naziv bio "Meeting Logger") | Zadržati radni naziv "Meeting Logger" | Usklađivanje sa postojećom WM linijom internih alata (JiraWM) — konzistentno imenovanje kroz mali interni tim | — |
| UI format trajanja: `Xh Ym` (npr. `1h 27m`) | `H:MM` (npr. `1:27`) | Čitljivije na prvi pogled u popup-u i history-ju, odlučeno tokom dizajna popup mockup-a | Decimalni export format (za Tempo) ostaje nepromenjen, ovo utiče samo na UI prikaz |

---

## 8. Poznati rizici

- **Meet DOM fragilnost** — content script selektori mogu prestati da rade posle Google UI update-a, bez ikakvog upozorenja korisniku. Nema automatske detekcije kvara u Fazi 1 — ako se log iznenada prestane popunjavati, to se primeti tek pri sledećem pregledu.
- **Nezatvorene sesije** — crash browsera ili force-quit ostavlja sesiju otvorenu (`endTime: null`). Zahteva ručnu intervenciju.
- **Bez sinhronizacije** — log je vezan za jedan browser profil na jednom računaru. Ako korisnik radi sa više mašina, log je fragmentiran (poznato i prihvaćeno za Fazu 1).

---

## 9. Otvorena pitanja (za Fazu 2+)

- Da li Google Calendar integracija zahteva OAuth verifikaciju sličnu Tempo problemu (Workspace admin odobrenje)?
- Da li ima smisla `projectTag` mapirati direktno na Jira issue key već u Fazi 1 UI-ju (bez funkcionalne veze), da bi export bio odmah spreman za copy-paste u Tempo formatu?
- Ako tim preraste trenutni krug — da li se distribucija tada seli na Web Store?

---

## 10. Metadata

- **Datum kreiranja:** 27. jul 2026.
- **Kontekst:** Nastalo iz razgovora — sve ključne odluke (scope, praćenje samo sopstvene sesije, flat log + view-layer grupisanje, UI struktura popup+history) su eksplicitno potvrđene pre pisanja ovog dokumenta.
- **Verzija v1.1:** naziv finalizovan na MeetWM (radni naziv bio "Meeting Logger"); nema drugih izmena sadržaja u odnosu na v1.0.
- **Verzija v1.2:** UI format trajanja promenjen sa `H:MM` na `Xh Ym` (npr. `1h 27m`), odlučeno tokom dizajna popup mockup-a; decimalni export format nepromenjen.
- **Sledeći korak:** `MEETWM-CC-SETUP-v1.1.md` — prvi prompt ka Claude Code za bootstrap repoa (već izvršen).
