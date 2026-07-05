# DGM Library Management System

## Tech Stack
- **Frontend**: ReactJS + Vite + TypeScript + Tailwind CSS
- **Backend**: NestJS + TypeORM
- **Database**: PostgreSQL 16
- **Auth**: JWT (Passport.js)
- **Dev tools**: Docker Compose + pgAdmin

## Khởi động nhanh

```bash
# 1. Clone và copy env
cp .env.example .env

# 2. Khởi động tất cả services
make up

# 3. Xem logs backend
make logs
```

## URLs
| Service  | URL                          |
|----------|------------------------------|
| Backend API | http://localhost:3000/api |
| Swagger UI  | http://localhost:3000/api/docs |
| Frontend    | http://localhost:5173     |
| pgAdmin     | http://localhost:5050     |

## pgAdmin Connection
- Host: `postgres`
- Port: `5432`
- Database: `dgm_library`
- Username: `dgm_user`
- Password: từ `.env`

## Cấu trúc thư mục Backend

```
backend/src/
├── config/          # App, DB, JWT config
├── common/
│   ├── entities/    # BaseEntity (id, createdAt, updatedAt)
│   ├── enums/       # Role enum
│   ├── decorators/  # @CurrentUser, @Roles
│   ├── guards/      # RolesGuard
│   ├── filters/     # GlobalExceptionFilter
│   ├── interceptors/ # ResponseInterceptor
│   └── pipes/       # ValidationPipe config
├── modules/
│   ├── identity/    # JWT Auth
│   ├── catalog/     # Quản lý sách
│   ├── membership/  # Thành viên
│   ├── circulation/ # Mượn/trả
│   ├── reservation/ # Đặt trước
│   ├── billing/     # Phí phạt và thanh toán
│   ├── inventory/   # Kiểm kê và trạng thái bản sao
│   ├── reporting/   # Báo cáo vận hành
│   ├── administration/ # Staff, RBAC, policy, audit
│   └── backup/      # PostgreSQL backup/restore
└── database/migrations/ # TypeORM migrations
```

## Lệnh hữu ích

```bash
make shell-be        # Vào shell backend
make shell-db        # Vào psql
make migrate         # Chạy migration
make migration name=CreateUserTable  # Tạo migration mới
make reset-db        # Reset DB (cẩn thận!)
```

Docker Compose tự chạy migration trước khi khởi động backend. Chức năng backup cần
`pg_dump`/`pg_restore`; các công cụ này đã được cài trong backend image. Khi chạy
backend trực tiếp ngoài Docker, cần cài PostgreSQL client và có thể cấu hình
`BACKUP_DIR` trong `.env`.
