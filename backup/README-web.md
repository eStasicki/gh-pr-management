# GitHub PR Management - Web Application

Nowoczesna aplikacja webowa do zarządzania Pull Requestami na GitHub z interfejsem użytkownika w przeglądarce.

## 🚀 Funkcjonalności

### ✅ Zarządzanie PR

- **Zmiana base branch** - dla wszystkich PR lub wybranych
- **Zarządzanie labelami** - dodawanie, usuwanie, zamiana labeli
- **Wyszukiwanie PR** - szybkie filtrowanie po tytule i numerze
- **Aktualizacja w czasie rzeczywistym** - odświeżanie listy PR

### 🌐 Wielojęzyczność

- **Polski** i **Angielski** interfejs
- **Przełączanie języków** w czasie rzeczywistym
- **Zapamiętywanie wyboru** w przeglądarce

### 🎨 Nowoczesny UI

- **Responsywny design** - działa na desktop i mobile
- **Gradient tła** i **glassmorphism** efekty
- **Animacje** i **hover effects**
- **Modalne okna** dla akcji
- **Loading states** i **notifications**

## 📋 Wymagania

- **GitHub Personal Access Token** z uprawnieniami:
  - `repo` (pełny dostęp do repozytorium)
  - `public_repo` (jeśli repozytorium jest publiczne)
- **Nowoczesna przeglądarka** z obsługą ES6+
- **Dostęp do internetu** (komunikacja z GitHub API)

## 🛠️ Instalacja i uruchomienie

### 1. Sklonuj repozytorium

```bash
git clone <repository-url>
cd gh-pr-management
```

### 2. Uruchom lokalny serwer

```bash
# Używając Python
python -m http.server 8000

# Lub używając Node.js
npx serve .

# Lub używając PHP
php -S localhost:8000
```

### 3. Otwórz w przeglądarce

```
http://localhost:8000
```

## 🔧 Konfiguracja

### 1. Utwórz GitHub Personal Access Token

1. Idź do GitHub → Settings → Developer settings → Personal access tokens
2. Kliknij "Generate new token"
3. Wybierz uprawnienia: `repo`, `public_repo`
4. Skopiuj wygenerowany token

### 2. Skonfiguruj aplikację

1. Wprowadź **Personal Access Token**
2. Wprowadź **właściciela repozytorium** (username)
3. Wprowadź **nazwę repozytorium**
4. Kliknij **"Zapisz konfigurację"**

## 📱 Użytkowanie

### Główne funkcje:

1. **Odświeżanie PR** - przycisk "Odśwież" w sekcji PR
2. **Wyszukiwanie** - wpisz w pole wyszukiwania
3. **Wybór PR** - kliknij na PR aby go zaznaczyć
4. **Akcje** - użyj przycisków w sekcji "Akcje"

### Dostępne akcje:

- **Zmień base-branch wszystkim PR** - zmienia base branch dla wszystkich otwartych PR
- **Zmień base-branch i zarządzaj labelami** - zmienia base branch + zarządzanie labelami
- **Zmień base-branch dla wybranego PR** - zmienia base branch tylko dla zaznaczonych PR
- **Zarządzaj labelami** - dodawanie, usuwanie, zamiana labeli

## 🔒 Bezpieczeństwo

- **Token jest przechowywany lokalnie** w localStorage przeglądarki
- **Nie jest wysyłany** na żadne zewnętrzne serwery
- **Komunikacja bezpośrednio** z GitHub API
- **HTTPS wymagane** w produkcji

## 🌐 API Endpoints

Aplikacja używa następujących GitHub API endpoints:

- `GET /repos/{owner}/{repo}/pulls` - lista PR
- `PATCH /repos/{owner}/{repo}/pulls/{number}` - aktualizacja PR
- `GET /repos/{owner}/{repo}/labels` - lista labeli
- `POST /repos/{owner}/{repo}/issues/{number}/labels` - dodawanie labeli
- `DELETE /repos/{owner}/{repo}/issues/{number}/labels/{name}` - usuwanie labeli
- `PUT /repos/{owner}/{repo}/issues/{number}/labels` - zamiana labeli

## 🎨 Customization

### Kolory i style:

- Edytuj `styles.css` aby zmienić wygląd
- Gradient tła: `background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- Główne kolory: `#4299e1` (niebieski), `#48bb78` (zielony), `#f56565` (czerwony)

### Tłumaczenia:

- Dodaj nowe języki w `script.js` w sekcji `loadTranslations()`
- Dodaj odpowiednie `data-translate` atrybuty w HTML

## 🐛 Troubleshooting

### Błąd 401 (Unauthorized):

- Sprawdź czy token jest poprawny
- Sprawdź czy token ma odpowiednie uprawnienia
- Sprawdź czy repozytorium istnieje i masz do niego dostęp

### Błąd 403 (Forbidden):

- Token może nie mieć wystarczających uprawnień
- Sprawdź czy repozytorium nie jest prywatne (jeśli używasz tokenu bez uprawnień do prywatnych repo)

### PR nie ładują się:

- Sprawdź połączenie z internetem
- Sprawdź czy nazwa właściciela i repozytorium są poprawne
- Sprawdź czy w repozytorium są otwarte PR

## 📄 Licencja

MIT License - możesz swobodnie używać, modyfikować i dystrybuować.
