# 🔐 Sensitive Data Encryption Setup

Wszystkie wrażliwe dane w konfiguracji są teraz automatycznie szyfrowane w bazie danych Supabase używając **AES-GCM-256** - branżowego standardu szyfrowania.

## 🔒 Co jest szyfrowane:

- **GitHub Token** - token dostępu do API
- **Repository Owner** - właściciel repozytorium
- **Repository Name** - nazwa repozytorium
- **Enterprise URL** - URL GitHub Enterprise (jeśli używany)

## 🚀 Szybka konfiguracja

### 1. Wygeneruj klucz szyfrowania

Uruchom w terminalu:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Skonfiguruj zmienne środowiskowe

**Lokalnie:**

```bash
# Skopiuj plik przykładowy
cp .env.example .env

# Edytuj .env i wklej wygenerowany klucz
VITE_ENCRYPTION_SECRET=twój-64-znakowy-klucz-tutaj
```

**Na produkcji (Vercel/Netlify/etc.):**

- Dodaj zmienną środowiskową: `VITE_ENCRYPTION_SECRET`
- Wklej ten sam klucz co lokalnie

### 3. Gotowe!

Aplikacja automatycznie:

- ✅ Zaszyfruje wszystkie wrażliwe dane przy zapisie
- ✅ Odszyfruje wszystkie dane przy odczycie
- ✅ Zmigruje stare niezaszyfrowane dane
- ✅ Użytkownicy nic nie zauważą

## 🔒 Bezpieczeństwo

- **Algorytm**: AES-GCM-256 (używany przez banki)
- **Klucz**: Unikalny per użytkownik (user_id + secret)
- **Solenie**: Każdy token ma unikalny salt
- **IV**: Unikalny wektor inicjalizacyjny dla każdego szyfrowania

## 📋 Format zaszyfrowanych danych

```
encrypted:${iv}:${salt}:${encryptedData}
```

Przykład:

```
encrypted:a1b2c3d4e5f6:9z8y7x6w5v:ZW5jcnlwdGVkZGF0YQ==
```

Wszystkie wrażliwe pola (token, owner, repo, enterprise_url) używają tego samego formatu.

## ⚠️ Ważne wskazówki

1. **Różne klucze**: Używaj różnych `VITE_ENCRYPTION_SECRET` dla development i production
2. **Bezpieczeństwo**: Nigdy nie commituj `.env` do git
3. **Backup**: Przechowuj klucz w menedżerze haseł
4. **Wymiana**: Jeśli klucz wycieknie - zmień natychmiast

## 🛠️ Rozwiązywanie problemów

**Błąd: "VITE_ENCRYPTION_SECRET environment variable is not set"**

- Sprawdź czy masz plik `.env` z kluczem
- Sprawdź czy klucz ma minimum 32 znaki

**Tokeny nie działają po aktualizacji**

- Sprawdź czy używasz tego samego klucza co wcześniej
- Stare tokeny będą automatycznie migrowane

**Chcesz zmienić klucz szyfrowania**

- Użytkownicy będą musieli ponownie wprowadzić tokeny
- Stare tokeny przestaną działać

## 📞 Wsparcie

Jeśli masz problemy z szyfrowaniem tokenów, sprawdź:

1. Czy `.env` zawiera prawidłowy klucz
2. Czy klucz jest taki sam na development i production
3. Czy nie ma błędów w konsoli przeglądarki
