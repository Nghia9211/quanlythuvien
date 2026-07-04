# DGM Library Management System

## Tech Stack
- **Frontend**: ReactJS + Vite + TypeScript + Tailwind CSS (chưa có code)
- **Backend**: NestJS + TypeORM
- **Database**: PostgreSQL 16
- **Auth**: JWT (Passport.js)
- **Dev tools**: Docker Compose + pgAdmin

---

## 🚀 Khởi động nhanh (đã được test)

### Bước 1: Tạo file .env
```bash
# Copy từ template (đã có sẵn file .env với giá trị mặc định)
# Nếu chưa có, tạo file .env với nội dung:
DB_NAME=dgm_library
DB_USER=dgm_user
DB_PASSWORD=DgmLib@2024
BACKUP_DIR=./backups
PGADMIN_EMAIL=admin@dgmlibrary.com
PGADMIN_PASSWORD=Admin@2024
JWT_SECRET=dgm_library_super_secret_key_for_jwt_access_token_2024_very_long_string
JWT_REFRESH_SECRET=dgm_library_another_secret_key_for_jwt_refresh_token_2024_long_string
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### Bước 2: Khởi động Docker (chỉ backend + DB, frontend chưa có code)
```powershell
cd c:\Users\Admin\Desktop\Document\AgenticCode\quanlythuvien
docker-compose up -d postgres pgadmin backend
```

### Bước 3: Kiểm tra logs backend
```powershell
docker logs dgm_backend --tail 30
```
> Chờ đến khi thấy `Nest application successfully started`

---

## 📋 URLs

| Service     | URL                            | Ghi chú              |
|-------------|--------------------------------|----------------------|
| Backend API | http://localhost:3000/api      |                      |
| Swagger UI  | http://localhost:3000/api/docs | Dùng để test API     |
| pgAdmin     | http://localhost:5050          | Quản lý database     |
| Frontend    | http://localhost:5173          | ❌ Chưa có code      |

---

## 🗄️ Kết nối pgAdmin

1. Mở http://localhost:5050
2. Đăng nhập:
   - Email: `admin@dgmlibrary.com`
   - Password: `Admin@2024`
3. Thêm server: Chuột phải **Servers** → **Register** → **Server**
4. Tab **General**: Name = `DGM Library`
5. Tab **Connection**:
   - Host: `postgres` ← **PHẢI là `postgres`**, không phải localhost
   - Port: `5432`
   - Database: `dgm_library`
   - Username: `dgm_user`
   - Password: `DgmLib@2024`

---

## 👤 Tạo tài khoản Admin (lần đầu chạy)

DB trống sau khi khởi động. Cần tạo admin thủ công trong pgAdmin Query Tool:

```sql
-- Tạo tài khoản admin
-- Thay <HASH> bằng bcrypt hash của password bạn muốn dùng
-- Cách tạo hash: dùng https://bcrypt-generator.com với rounds=12
INSERT INTO user_accounts (id, username, password_hash, role, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin',
  '<HASH_BCRYPT_12_ROUNDS>',
  'ADMIN',
  true,
  NOW(),
  NOW()
);

-- Thêm Reservation Policy (cần để module đặt trước hoạt động)
INSERT INTO reservation_policies (id, max_active_reservations, hold_hours, effective_from, is_active)
VALUES (gen_random_uuid(), 3, 48, NOW(), true);
```

---

## 🧪 Test API trên Swagger

### Login để lấy token
```
POST /api/auth/login
{
  "username": "admin",
  "password": "<password của bạn>"
}
```

### Authorize trong Swagger
1. Copy `accessToken` từ response login
2. Click **🔒 Authorize** (góc trên phải Swagger)
3. Paste token → Click **Authorize**

> ⚠️ Token hết hạn sau **15 phút**. Cần login lại khi hết hạn.

---

## 🔧 Bugs đã fix (ngày 2026-07-04)

| File | Vấn đề | Fix |
|------|--------|-----|
| `config/typeorm.config.ts` | `dotenv.config({ quiet: true })` - option không tồn tại | Xóa `quiet: true` |
| `database/data-source.ts` | `dotenv.config({ quiet: true })` | Xóa `quiet: true` |
| `security/bcrypt-password-hasher.ts` | Constructor param bị NestJS DI inject sai | Thêm `@Optional() @Inject(BCRYPT_ROUNDS)` |
| `entities/branch.orm-entity.ts` | `address: string \| null` → TypeORM đọc là `Object` | Thêm `type: 'varchar'` |
| `entities/payment-transaction.orm-entity.ts` | `providerReference` thiếu type | Thêm `type: 'varchar'` |
| `infrastructure/backup-job.orm-entity.ts` | `operation`, `status` string literal thiếu type | Thêm `type: 'varchar'` |
| `main.ts` | Swagger không gửi Bearer token cho endpoints | Thêm `.addSecurityRequirements('access-token')` |

---

## 📁 Cấu trúc thư mục Backend

```
backend/src/
├── config/          # App, DB, JWT config
├── common/
│   ├── entities/    # BaseEntity, UserAccountOrmEntity
│   ├── enums/       # Role enum (ADMIN, STAFF, READER)
│   ├── decorators/  # @CurrentUser, @Roles, @Public
│   ├── guards/      # RolesGuard, PermissionsGuard
│   ├── filters/     # GlobalExceptionFilter
│   ├── interceptors/ # ResponseInterceptor
│   └── pipes/       # ValidationPipe config
├── modules/
│   ├── identity/    # JWT Auth (login, refresh, logout)
│   ├── catalog/     # Quản lý sách & chi nhánh
│   ├── membership/  # Đăng ký & quản lý bạn đọc
│   ├── circulation/ # Mượn/trả sách
│   ├── reservation/ # Đặt trước sách
│   ├── billing/     # Phí phạt & thanh toán
│   ├── inventory/   # Kiểm kê kho sách
│   ├── reporting/   # Báo cáo thống kê
│   ├── administration/ # Quản lý staff & roles
│   └── backup/      # Sao lưu dữ liệu
└── database/
    └── migrations/  # TypeORM migrations
```

---

## 🗺️ Luồng test API theo thứ tự

```
1. POST /api/auth/login          → lấy accessToken
2. POST /api/catalog-mgmt/branches  → tạo chi nhánh (lưu branchId)
3. POST /api/catalog-mgmt/branches/{branchId}/shelves → tạo kệ (lưu shelfId)
4. POST /api/catalog-mgmt/titles    → tạo đầu sách (lưu bookTitleId)
5. POST /api/catalog-mgmt/copies    → thêm bản sách (lưu barcode)
6. POST /api/readers               → tạo bạn đọc (lưu readerId, cardNumber)
7. POST /api/circulation/loans     → cho mượn sách
8. POST /api/circulation/returns   → trả sách
```

---

## 🐳 Lệnh Docker hữu ích

```powershell
# Xem logs backend
docker logs dgm_backend --tail 50

# Restart backend
docker restart dgm_backend

# Rebuild backend (sau khi sửa code)
docker-compose up -d --build backend

# Dừng tất cả
docker-compose down

# Dừng và xóa data (reset hoàn toàn)
docker-compose down -v
```

---

## ⚠️ Lưu ý quan trọng

- **Frontend chưa có code** → không chạy được service `frontend` trong docker-compose
- Chỉ chạy: `docker-compose up -d postgres pgadmin backend`
- **Docker Desktop phải đang chạy** trước khi dùng lệnh docker
- `docker-compose down -v` sẽ **xóa toàn bộ data DB** — cẩn thận!
- Token JWT hết hạn sau **15 phút** (JWT_ACCESS_EXPIRES_IN=15m)
