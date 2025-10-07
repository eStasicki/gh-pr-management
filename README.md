# GitHub PR Management Script

Skrypt do zarządzania Pull Requestami na GitHub.

## Setup / Konfiguracja

### 1. Skopiuj plik konfiguracyjny

```bash
cp .gh-pr-management-config.example .gh-pr-management-config
```

### 2. Edytuj plik konfiguracyjny

```bash
nano .gh-pr-management-config
```

### 3. Ustaw ścieżkę repozytorium

```bash
REPO_SRC=/path/to/your/github/repository
```

### 4. Uruchom skrypt

```bash
./manage_pr.sh
```

## Configuration / Konfiguracja

Plik `.gh-pr-management-config` zawiera:

- `LANGUAGE=pl` - język interfejsu (pl/en)
- `REPO_SRC=/path/to/repo` - ścieżka do repozytorium GitHub

## Features / Funkcje

1. Zmień base-branch wszystkim PR
2. Zmień base-branch i usuń/ustaw labeli
3. Zmień base-branch dla wskazanego PR
4. Podmień base-branch PR zaczynających się od UNIC/fixversion-\*
5. Zmień base-branch dla wskazanego PR z opcją podmiany label
6. Usuń wybraną label z wybranego PR i ewentualnie dodaj nową
7. Zmień język
8. Zmień ścieżkę repozytorium
9. Zakończ

## Requirements / Wymagania

- `gh` CLI (GitHub CLI) - musi być zalogowany (`gh auth login`)
- `jq` (JSON processor)
- Dostęp do repozytorium GitHub
- Repozytorium musi być lokalnie sklonowane

## Important / Ważne

Skrypt automatycznie przechodzi do katalogu repozytorium przed wykonaniem komend GitHub CLI.
Upewnij się, że ścieżka `REPO_SRC` wskazuje na katalog z repozytorium Git.
