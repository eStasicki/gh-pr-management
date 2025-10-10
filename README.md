# GitHub PR Management

Aplikacja webowa do zarządzania Pull Requestami na GitHub zbudowana w SvelteKit z TypeScript i Tailwind CSS.

## Funkcje

- 🚀 **SvelteKit** - Nowoczesny framework z SSR
- 💎 **TypeScript** - Type safety i lepsze DX
- 🎨 **Tailwind CSS** - Responsywny design
- 🔐 **Supabase Auth** - Bezpieczna autoryzacja przez Google/GitHub
- 🌍 **Wielojęzyczność** - Polski/Angielski
- ⚡ **Hot reload** - Szybki development
- 🔧 **Zmienne środowiskowe** - Łatwa konfiguracja

## Szybki start

### 1. Instalacja

```bash
yarn install
```

### 2. Konfiguracja Supabase

1. Utwórz projekt na [supabase.com](https://supabase.com)
2. Skopiuj URL projektu i anon key z Settings > API
3. Skonfiguruj OAuth providers w Authentication > Providers

```bash
cp .env.example .env
# Edytuj .env z danymi Supabase i GitHub
```

### 3. Konfiguracja OAuth

W Supabase Dashboard:

- Authentication > Providers > Google/GitHub
- Dodaj Client ID i Client Secret
- Ustaw Redirect URL: `http://localhost:5173/auth/callback`

### 4. Development

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
# Supabase
VITE_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
VITE_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# GitHub (opcjonalne - dla funkcji PR)
VITE_GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
VITE_REPO_OWNER=username
VITE_REPO_NAME=repository-name
VITE_GITHUB_ENTERPRISE_URL=
```

### GitHub Secrets (produkcja)

- `VITE_PUBLIC_SUPABASE_URL` - URL projektu Supabase
- `VITE_PUBLIC_SUPABASE_ANON_KEY` - Anon key Supabase
- `GITHUB_TOKEN` - Token GitHub (opcjonalne)
- `REPO_OWNER` - Właściciel repozytorium (opcjonalne)
- `REPO_NAME` - Nazwa repozytorium (opcjonalne)
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
