# Konfiguracja Supabase dla localhost

## Problem
Po zalogowaniu na localhost przekierowanie następuje na domenę produkcyjną zamiast pozostać na localhost.

## Rozwiązanie

### 1. Konfiguracja Site URL w Supabase

1. Przejdź do Supabase Dashboard: https://supabase.com/dashboard
2. Wybierz swój projekt
3. Przejdź do **Settings** → **Authentication** → **URL Configuration**
4. W sekcji **Site URL** dodaj oba URL-e:
   - Dla development: `http://localhost:5173`
   - Dla produkcji: `https://twoja-domena-produkcyjna.com`
   
   **WAŻNE:** Site URL może być ustawiony tylko na jedną wartość. Jeśli masz ustawioną domenę produkcyjną:
   - **Opcja A:** Zmień Site URL na `http://localhost:5173` podczas developmentu
   - **Opcja B:** Użyj tylko Redirect URLs (preferowane)

### 2. Konfiguracja Redirect URLs

**To jest kluczowe!** Redirect URLs mają wyższy priorytet niż Site URL.

1. W tym samym miejscu (**Settings** → **Authentication** → **URL Configuration**)
2. W sekcji **Redirect URLs** dodaj oba URL-e:
   ```
   http://localhost:5173/auth/callback
   https://twoja-domena-produkcyjna.com/auth/callback
   ```

### 3. Konfiguracja OAuth Provider (Google)

1. Przejdź do **Authentication** → **Providers** → **Google**
2. Upewnij się, że w **Redirect URLs** masz dodane:
   ```
   http://localhost:5173/auth/callback
   https://twoja-domena-produkcyjna.com/auth/callback
   ```
3. W Google Cloud Console również dodaj oba URL-e w **Authorized redirect URIs**

### 4. Sprawdź zmienne środowiskowe

Upewnij się, że masz poprawne zmienne w `.env`:

```env
VITE_PUBLIC_SUPABASE_URL=https://twoj-projekt.supabase.co
VITE_PUBLIC_SUPABASE_ANON_KEY=twoj-klucz
```

## Ważne uwagi

- **Redirect URLs** mają wyższy priorytet niż **Site URL**
- Możesz mieć wiele Redirect URLs - Supabase sprawdzi wszystkie
- Jeśli nadal masz problemy, wyczyść cache przeglądarki i ciasteczka
- Upewnij się, że port w localhost (domyślnie 5173) jest poprawny

## Testowanie

Po konfiguracji:
1. Uruchom aplikację lokalnie: `npm run dev`
2. Przejdź do `http://localhost:5173/login`
3. Kliknij "Sign in with Google"
4. Po zalogowaniu powinieneś zostać przekierowany na `http://localhost:5173/auth/callback`, a następnie na `/dashboard`

Jeśli nadal masz problemy, sprawdź konsolę przeglądarki (F12) pod kątem błędów.

