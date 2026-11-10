# Onsaldo preview

A one-page Polish accounting demo for **Onsaldo Preview Sp. z o.o.** It shows the area map «Obszary księgowe» and the VAT registers «Rejestry i VAT». All figures are demo data for October 2026. Nothing is written to a real ledger.

## Run

```bash
npm install
npm run dev
```

The app opens at http://localhost:5173/.

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm test` | Vitest and Testing Library |
| `npm run lint` | Oxlint |
| `npm run build` | Typecheck, then production build |
| `npm run preview` | Serve the production build |

Stack: React 19, TypeScript, Vite, Vitest. The UI uses Inter, teal `#0B6B5E`, pale blue accents, white cards, and a 12px radius.

## Current configuration

The page has three parts.

1. **Welcome bar.** Greeting, light/dark theme, four notifications, and the account menu.
2. **«Obszary księgowe».** Title and scope notice, the period card «Okres księgowy · 2026» (the «Wymaga konfiguracji» control toggles the ring), area tabs, and the cards for the selected area. «Rejestr VAT» scrolls to the register. Księgowania, Majątek, and Kontrole replace the register with a placeholder.
3. **«Rejestry i VAT».** Sales and purchases are separate tabs. The toolbar is one row: search, a «Filtry» button, and a «⋯» menu. On a wide screen, print and download stay beside the menu. Active filters appear as removable chips. The summary shows Netto, VAT, and Brutto, with «Kwoty według stawek VAT» open underneath. The list can be sorted, columns can be shown, hidden, and reordered, and a row expands to its fields plus Faktura/Korekta (sales) or Zakup/Korekta (purchases). Changing the operation updates the document number and the amber correction mark. The footer pages the rows at 10, 25, or 50 per page.

A corner switch, «Stan: dane / brak / błąd», previews the filled list, an empty list, and a load error. Changing a tab, a page, or the applied filters shows a short skeleton.

On a phone the filters open in a bottom sheet and each row becomes a card. The page does not scroll sideways from 320px to 1440px.

## What changed since the first commit

The first commit (`2d27b30`, “Add the Onsaldo ledger preview as the starting page.”) is the baseline. The welcome bar, the four area tabs, the placeholders, and the two VAT registers are still the same demo.

| | First commit | Now |
| --- | --- | --- |
| Area list | One accordion of all six items. Each item opens its own sentence. | Cards for the selected tab only, with ready, setup, and locked states. «Rejestr VAT» jumps to the register. |
| Period card | Static text, «Wymaga konfiguracji». | Same copy, plus a toggle and a progress ring. |
| VAT toolbar | Search and every action visible at once, including a compact/comfortable density switch. | Search grows. Filters sit behind «Filtry». Tags, print, download, refresh, and columns sit in «⋯». Print and download stay visible when there is room. The density switch is gone. |
| Filters | Rok, Miesiąc, Rodzaj operacji, Kod JPK V7, and Serie dokumentów are always on the page. | Same filters, in a popover on desktop and a bottom sheet on a phone. They apply together. Active ones are chips, cleared with «Wyczyść filtry». |
| Columns | Kontrahent, Data, Numer dokumentu, Numer KSeF, and Identyfikator are always shown. Headers sort. | Same columns and sorting. The menu can hide a column and move it up or down. A narrow table hides Identyfikator until it is turned back on. A phone uses cards. |
| Row detail | Amounts for the rate. The operation is fixed in the data. | Same amounts, plus a working operation switch. Sales: Faktura or Korekta. Purchases: Zakup or Korekta. |
| Summary | Netto, VAT, Brutto, and the rate bars are always visible. | Same figures. Brutto is the emphasized amount. The rate bars stay open. |
| Pages | 10, 20, or 50 rows. | 10, 25, or 50 rows. |
| States | Only the live list, including a real empty filter result. | The live list, plus «Stan: dane / brak / błąd» and a loading skeleton. |
| Layout | A single table layout. | The same page, refitted so the register stays readable from a 320px phone to a 1440px desktop. |
