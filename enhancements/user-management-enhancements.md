# Propozycje rozszerzeń systemu zarządzania użytkownikami

## 🚀 **Dodatkowe funkcje zarządzania użytkownikami**

### 1. **📊 Dashboard i Statystyki**

```typescript
// Nowe funkcje w adminService
async getUserStats(): Promise<{
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  adminUsers: number;
  newUsersThisMonth: number;
  bannedUsersThisMonth: number;
}>
```

### 2. **🔍 Zaawansowane wyszukiwanie i filtrowanie**

- **Wyszukiwanie po emailu** (partial match)
- **Filtry:** Status (aktywny/zbanowany), Rola (admin/user), Data dołączenia
- **Sortowanie:** Po emailu, dacie dołączenia, ostatniej aktywności
- **Eksport do CSV** listy użytkowników

### 3. **📧 Masowe operacje**

- **Masowe banowanie** wybranych użytkowników
- **Masowa zmiana ról** (np. wszystkich użytkowników na user)
- **Masowe wysyłanie emaili** do wybranej grupy

### 4. **📈 Historia aktywności**

```sql
-- Nowa tabela user_activity_log
CREATE TABLE user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'login', 'logout', 'banned', 'unbanned', 'role_changed'
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. **🛡️ Zaawansowane zabezpieczenia**

#### **Rate Limiting dla adminów:**

```typescript
// Ograniczenie liczby operacji banowania na godzinę
const BAN_RATE_LIMIT = 10; // max 10 banów na godzinę
```

#### **Audit Log:**

```sql
-- Tabela audit_log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'ban_user', 'unban_user', 'change_role'
  target_user_id UUID REFERENCES auth.users(id),
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 6. **⚡ Automatyczne funkcje**

#### **Auto-unban po czasie:**

```sql
-- Funkcja do automatycznego odbanowania
CREATE OR REPLACE FUNCTION auto_unban_expired_users()
RETURNS INTEGER AS $$
DECLARE
  unbanned_count INTEGER;
BEGIN
  DELETE FROM banned_users
  WHERE ban_expires_at IS NOT NULL
  AND ban_expires_at <= NOW();

  GET DIAGNOSTICS unbanned_count = ROW_COUNT;
  RETURN unbanned_count;
END;
$$ LANGUAGE plpgsql;

-- Cron job (w Supabase Edge Functions)
```

#### **Inactive user cleanup:**

```sql
-- Automatyczne banowanie nieaktywnych użytkowników (np. > 1 rok)
CREATE OR REPLACE FUNCTION ban_inactive_users()
RETURNS INTEGER AS $$
DECLARE
  banned_count INTEGER;
BEGIN
  INSERT INTO banned_users (user_id, banned_by, banned_at, reason)
  SELECT
    u.id,
    'system'::UUID, -- specjalny UUID dla systemu
    NOW(),
    'Automatyczne banowanie za nieaktywność (>1 rok)'
  FROM auth.users u
  LEFT JOIN user_roles ur ON u.id = ur.user_id
  WHERE u.last_sign_in_at < NOW() - INTERVAL '1 year'
  AND ur.role != 'admin' -- nie banuj adminów
  AND NOT EXISTS (SELECT 1 FROM banned_users bu WHERE bu.user_id = u.id);

  GET DIAGNOSTICS banned_count = ROW_COUNT;
  RETURN banned_count;
END;
$$ LANGUAGE plpgsql;
```

### 7. **📱 Notyfikacje i komunikacja**

#### **Email notifications:**

```typescript
// Wysyłanie emaili o banowaniu
async sendBanNotification(userEmail: string, reason: string, expiresAt: string | null) {
  // Integracja z SendGrid, Resend, lub Supabase Email
}
```

#### **In-app notifications:**

```typescript
// System powiadomień w aplikacji
interface Notification {
  id: string;
  userId: string;
  type: "ban" | "unban" | "role_change" | "system";
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}
```

### 8. **🎨 UI/UX Usprawnienia**

#### **Bulk actions toolbar:**

```svelte
<!-- Toolbar z akcjami masowymi -->
<div class="bulk-actions-toolbar">
  <span>{selectedUsers.length} użytkowników wybranych</span>
  <button on:click={bulkBan}>Zbanuj wybranych</button>
  <button on:click={bulkUnban}>Odbanuj wybranych</button>
  <button on:click={bulkChangeRole}>Zmień rolę</button>
</div>
```

#### **Advanced filters:**

```svelte
<!-- Panel filtrów -->
<div class="filters-panel">
  <input bind:value={searchEmail} placeholder="Szukaj po emailu..." />
  <select bind:value={statusFilter}>
    <option value="">Wszystkie</option>
    <option value="active">Aktywni</option>
    <option value="banned">Zbanowani</option>
  </select>
  <select bind:value={roleFilter}>
    <option value="">Wszystkie role</option>
    <option value="admin">Admini</option>
    <option value="user">Użytkownicy</option>
  </select>
</div>
```

### 9. **📊 Raporty i Analytics**

#### **User activity dashboard:**

```typescript
interface UserAnalytics {
  dailyActiveUsers: number;
  monthlyActiveUsers: number;
  banRate: number; // % zbanowanych użytkowników
  averageSessionDuration: number;
  topBannedReasons: Array<{ reason: string; count: number }>;
}
```

### 10. **🔐 Dodatkowe zabezpieczenia**

#### **IP-based restrictions:**

```sql
-- Tabela allowed_ips dla adminów
CREATE TABLE admin_allowed_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id),
  ip_address INET NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **Two-factor authentication dla adminów:**

```typescript
// Wymaganie 2FA dla operacji banowania
async require2FAForBan(): Promise<boolean> {
  // Integracja z TOTP/SMS
}
```

## 🎯 **Priorytet implementacji:**

### **Wysoki priorytet:**

1. **Audit log** - śledzenie wszystkich działań adminów
2. **Zaawansowane wyszukiwanie** - lepsze UX
3. **Statystyki dashboard** - przegląd systemu

### **Średni priorytet:**

4. **Masowe operacje** - wydajność dla dużych list
5. **Auto-unban** - automatyzacja
6. **Email notifications** - komunikacja z użytkownikami

### **Niski priorytet:**

7. **IP restrictions** - dodatkowe zabezpieczenia
8. **2FA dla adminów** - zaawansowane bezpieczeństwo
9. **Analytics dashboard** - szczegółowe raporty

## 💡 **Natychmiastowe usprawnienia:**

1. **Dodaj loading states** dla wszystkich operacji
2. **Confirmation dialogs** dla wszystkich destrukcyjnych akcji
3. **Toast notifications** zamiast alertów
4. **Keyboard shortcuts** (Ctrl+B dla banowania)
5. **Bulk selection** z checkboxami

## 📋 **Szczegółowe plany implementacji:**

### **Audit Log System**

```sql
-- 1. Utworzenie tabeli audit_log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id),
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Trigger do automatycznego logowania
CREATE OR REPLACE FUNCTION log_admin_action()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (admin_id, action, target_user_id, old_values, new_values, ip_address)
  VALUES (
    auth.uid(),
    TG_OP,
    COALESCE(NEW.user_id, OLD.user_id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    inet_client_addr()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 3. Triggers dla różnych tabel
CREATE TRIGGER audit_user_roles_changes
  AFTER INSERT OR UPDATE OR DELETE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION log_admin_action();

CREATE TRIGGER audit_banned_users_changes
  AFTER INSERT OR UPDATE OR DELETE ON banned_users
  FOR EACH ROW EXECUTE FUNCTION log_admin_action();
```

### **Advanced Search & Filtering**

```typescript
// adminService.ts
interface UserFilters {
  search?: string;
  status?: 'active' | 'banned';
  role?: 'admin' | 'user';
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'email' | 'created_at' | 'last_sign_in_at';
  sortOrder?: 'asc' | 'desc';
}

async getUsersWithFilters(filters: UserFilters, page: number = 1, pageSize: number = 10) {
  // Implementacja zaawansowanego wyszukiwania z filtrami
}
```

### **Bulk Operations**

```typescript
// adminService.ts
async bulkBanUsers(userIds: string[], expiresAt: string | null, reason?: string) {
  // Masowe banowanie użytkowników
}

async bulkUnbanUsers(userIds: string[]) {
  // Masowe odbanowanie użytkowników
}

async bulkChangeUserRoles(userIds: string[], newRole: 'admin' | 'user') {
  // Masowa zmiana ról
}
```

### **Email Notifications**

```typescript
// emailService.ts
interface EmailTemplate {
  ban: {
    subject: string;
    template: string;
  };
  unban: {
    subject: string;
    template: string;
  };
}

async sendBanEmail(userEmail: string, reason: string, expiresAt: string | null) {
  // Wysyłanie emaila o banowaniu
}

async sendUnbanEmail(userEmail: string) {
  // Wysyłanie emaila o odbanowaniu
}
```

### **Dashboard Statistics**

```typescript
// adminService.ts
interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  adminUsers: number;
  newUsersThisMonth: number;
  bannedUsersThisMonth: number;
  banRate: number;
  averageSessionDuration: number;
  topBannedReasons: Array<{reason: string, count: number}>;
  userGrowthChart: Array<{date: string, count: number}>;
  banTrendsChart: Array<{date: string, banned: number, unbanned: number}>;
}

async getDashboardStats(): Promise<DashboardStats> {
  // Implementacja statystyk dashboard
}
```

## 🔧 **Implementacja krok po kroku:**

### **Faza 1: Podstawowe usprawnienia (1-2 dni)**

1. ✅ Audit log system
2. ✅ Loading states i error handling
3. ✅ Confirmation dialogs
4. ✅ Toast notifications

### **Faza 2: Zaawansowane funkcje (3-5 dni)**

1. ✅ Advanced search & filtering
2. ✅ Bulk operations
3. ✅ Dashboard statistics
4. ✅ Export to CSV

### **Faza 3: Automatyzacja (2-3 dni)**

1. ✅ Auto-unban expired users
2. ✅ Email notifications
3. ✅ Inactive user cleanup
4. ✅ Scheduled tasks

### **Faza 4: Zaawansowane zabezpieczenia (3-4 dni)**

1. ✅ Rate limiting
2. ✅ IP restrictions
3. ✅ 2FA for admins
4. ✅ Advanced audit trails

### **Faza 5: Analytics & Reporting (2-3 dni)**

1. ✅ User analytics dashboard
2. ✅ Ban trends analysis
3. ✅ Performance metrics
4. ✅ Custom reports

## 📝 **Notatki implementacyjne:**

- **Wszystkie nowe funkcje powinny być opcjonalne** - nie zakłócać istniejącej funkcjonalności
- **Backward compatibility** - zachować kompatybilność z istniejącym kodem
- **Performance** - wszystkie zapytania powinny być zoptymalizowane
- **Security first** - każde nowe API powinno być zabezpieczone
- **Testing** - każda nowa funkcja powinna mieć testy jednostkowe
- **Documentation** - dokumentacja dla wszystkich nowych funkcji

## 🎯 **Metryki sukcesu:**

- **Wydajność:** < 200ms dla wszystkich operacji banowania
- **Bezpieczeństwo:** 0% nieautoryzowanych operacji
- **UX:** < 3 kliknięć dla każdej akcji
- **Dostępność:** 99.9% uptime dla funkcji admina
- **Skalowalność:** Obsługa 10,000+ użytkowników bez spadku wydajności
