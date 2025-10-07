# GitHub PR Management

Aplikacja webowa do zarządzania Pull Requestami na GitHub z obsługą konfiguracji środowiskowej.

## Funkcje

- Zarządzanie wieloma Pull Requestami jednocześnie
- Zmiana base branch dla wybranych PR
- Dodawanie, usuwanie i zamiana labeli
- Tryb bezpieczny - pokazuje tylko Twoje PR
- Obsługa wielu języków (Polski/Angielski)
- Konfiguracja oparta na zmiennych środowiskowych

## Szybki start

### Rozwój lokalny

1. Sklonuj repozytorium:

   ```bash
   git clone <repository-url>
   cd gh-pr-management
   ```

2. Skonfiguruj aplikację:

   ```bash
   cp .env.example .env
   # Edytuj .env z danymi GitHub
   ```

3. Uruchom serwer deweloperski:

   ```bash
   npm run dev
   ```

4. Otwórz http://localhost:8000 w przeglądarce

### Wdrożenie produkcyjne

1. Skonfiguruj GitHub Secrets w repozytorium:

   - Przejdź do Settings → Secrets and variables → Actions
   - Dodaj: `GITHUB_TOKEN`, `REPO_OWNER`, `REPO_NAME`, `GITHUB_ENTERPRISE_URL` (opcjonalne)

2. Wypchnij na branch main - GitHub Actions automatycznie wdroży

## Konfiguracja

### Szybki start

1. **Lokalny rozwój:**

   ```bash
   cp .env.example .env
   # Edytuj .env z danymi GitHub
   npm run dev
   ```

2. **Produkcja:**
   - Dodaj sekrety w GitHub: `GITHUB_TOKEN`, `REPO_OWNER`, `REPO_NAME`, `GITHUB_ENTERPRISE_URL`
   - Wypchnij na main - automatyczne wdrożenie

Zobacz [CONFIG.md](CONFIG.md) dla szczegółowych instrukcji konfiguracji.

## Bezpieczeństwo

- Tokeny są szyfrowane w localStorage
- Widoczne i zarządzalne są tylko Twoje PR
- Pliki z danymi wrażliwymi są wykluczone z kontroli wersji

## Stary skrypt bash

Poprzednia wersja skryptu bash jest dostępna w pliku `manage_pr.sh` dla użytkowników preferujących interfejs terminala.
