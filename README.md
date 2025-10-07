# GitHub PR Management

Aplikacja webowa do zarządzania Pull Requestami na GitHub zbudowana w SvelteKit z TypeScript i Tailwind CSS.

## Funkcje

- 🚀 **SvelteKit** - Nowoczesny framework z SSR
- 💎 **TypeScript** - Type safety i lepsze DX
- 🎨 **Tailwind CSS** - Responsywny design
- 🔐 **Bezpieczeństwo** - Tylko Twoje PR są widoczne
- 🌍 **Wielojęzyczność** - Polski/Angielski
- ⚡ **Hot reload** - Szybki development
- 🔧 **Zmienne środowiskowe** - Łatwa konfiguracja

## Szybki start

### 1. Instalacja

```bash
yarn install
```

### 2. Konfiguracja

```bash
cp .env.example .env
# Edytuj .env z danymi GitHub
```

### 3. Development

```bash
yarn dev
```

Otwórz http://localhost:5173 w przeglądarce!

## Dostępne komendy

- `yarn dev` - Serwer deweloperski z hot reload
- `yarn build` - Build produkcyjny
- `yarn preview` - Podgląd builda
- `yarn check` - Sprawdzenie typów TypeScript

## Konfiguracja

### Zmienne środowiskowe (.env)

```env
VITE_GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
VITE_REPO_OWNER=username
VITE_REPO_NAME=repository-name
VITE_GITHUB_ENTERPRISE_URL=
```

### GitHub Secrets (produkcja)

- `GITHUB_TOKEN` - Token GitHub
- `REPO_OWNER` - Właściciel repozytorium
- `REPO_NAME` - Nazwa repozytorium
- `GITHUB_ENTERPRISE_URL` - URL GitHub Enterprise (opcjonalne)

## Wdrożenie

Aplikacja automatycznie wdraża się na GitHub Pages po push na branch `main`.

## Struktura projektu

```
src/
├── lib/
│   ├── components/     # Komponenty Svelte
│   ├── stores/         # Svelte stores
│   ├── types/          # Definicje TypeScript
│   └── translations.ts # Tłumaczenia
├── routes/
│   ├── +layout.svelte  # Główny layout
│   └── +page.svelte    # Strona główna
└── app.html           # HTML template
```

## Bezpieczeństwo

- Tokeny są szyfrowane w localStorage
- Widoczne są tylko Twoje PR
- Zmienne środowiskowe są bezpieczne
- Pliki .env nie są commitowane

## Stary skrypt bash

Poprzednia wersja skryptu bash jest dostępna w folderze `backup/` dla użytkowników preferujących interfejs terminala.
