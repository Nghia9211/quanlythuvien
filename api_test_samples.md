# 🧪 DGM Library – API Test Samples

> **Base URL:** `http://localhost:3000/api`
> **Swagger UI:** `http://localhost:3000/api/docs`
>
> ⚠️ Làm theo **đúng thứ tự** vì các bước sau cần ID từ bước trước.

---

## BƯỚC 1 – 🔑 Auth: Đăng nhập lấy Token

### 1.1 Đăng ký bạn đọc (tạo tài khoản đầu tiên)
> Làm ở **Bước 3** trước, nhưng sau khi có tài khoản thì login ở đây.

### 1.2 Login (sau khi đã tạo reader)
```
POST /api/auth/login
Content-Type: application/json
```
```json
{
  "username": "nguyenvana",
  "password": "Password123!"
}
```
**Response:** Lưu lại `accessToken` và `refreshToken`

---

### 1.3 Xem thông tin user hiện tại
```
GET /api/auth/me
Authorization: Bearer <accessToken>
```

### 1.4 Refresh token
```
POST /api/auth/refresh
Content-Type: application/json
```
```json
{
  "refreshToken": "<refreshToken từ bước login>"
}
```

### 1.5 Logout
```
POST /api/auth/logout
Authorization: Bearer <accessToken>
```

---

## BƯỚC 2 – 📚 Catalog: Tạo Sách & Chi nhánh

> ⚠️ Cần token của **STAFF/ADMIN**. Hiện tại DB trống nên cần seed admin trước (xem ghi chú cuối).

### 2.1 Tạo Chi nhánh thư viện
```
POST /api/catalog-mgmt/branches
Authorization: Bearer <accessToken>
Content-Type: application/json
```
```json
{
  "code": "HN01",
  "name": "Chi nhánh Hà Nội - Hoàn Kiếm",
  "address": "1 Đinh Tiên Hoàng, Hoàn Kiếm, Hà Nội"
}
```
📌 **Lưu lại `id` của branch** → dùng ở bước sau

---

67e3b721-a2c4-474d-8f7c-58653dba8bce


### 2.2 Tạo Kệ sách trong chi nhánh
```
POST /api/catalog-mgmt/branches/{branchId}/shelves
Authorization: Bearer <accessToken>
Content-Type: application/json
```
> Thay `{branchId}` = id lấy từ bước 2.1
```json
{
  "code": "A01",
  "label": "Kệ A - Tầng 1 - Văn học"
}
```
📌 **Lưu lại `id` của shelf**

---

{
  "success": true,
  "data": {
    "id": "ddf730e9-bbdc-4cca-a4ed-3e0c2d266930",
    "branchId": "67e3b721-a2c4-474d-8f7c-58653dba8bce",
    "code": "A01",
    "label": "Kệ A - Tầng 1 - Văn học"
  }
}

### 2.3 Tạo Đầu sách (Book Title)
```
POST /api/catalog-mgmt/titles
Authorization: Bearer <accessToken>
Content-Type: application/json
```
```json
{
  "title": "Lập Trình NestJS Từ Cơ Bản Đến Nâng Cao",
  "isbn": "978-604-2-12345-7",
  "authors": ["Nguyễn Văn Lập", "Trần Thị Code"],
  "subjects": ["Lập trình", "NodeJS", "TypeScript"],
  "publisher": "NXB Khoa học Kỹ thuật"
}
```
📌 **Lưu lại `id` của book title**

---

{
  "success": true,
  "data": {
    "id": "aa6d6762-1fb2-4141-ac08-dd091b095706",
    "title": "Lập Trình NestJS Từ Cơ Bản Đến Nâng Cao",
    "isbn": "9786042123457",
    "authors": [
      "Nguyễn Văn Lập",
      "Trần Thị Code"
    ],
    "subjects": [
      "Lập trình",
      "NodeJS",
      "TypeScript"
    ],
    "publisher": "NXB Khoa học Kỹ thuật"
  }
}

### 2.4 Thêm Bản sách vật lý (Book Copy)
```
POST /api/catalog-mgmt/copies
Authorization: Bearer <accessToken>
Content-Type: application/json
```
> Dùng các id đã lưu từ bước 2.1, 2.2, 2.3
```json
{
  "bookTitleId": "<id từ bước 2.3>",
  "barcode": "LIB-2024-00001",
  "rfid": null,
  "branchId": "<id từ bước 2.1>",
  "shelfLocationId": "<id từ bước 2.2>"
}
```
📌 **Lưu lại `barcode`** → dùng khi mượn sách

{
  "success": true,
  "data": {
    "id": "3a095240-f501-4f2d-8242-8b8795fa6e07",
    "bookTitleId": "aa6d6762-1fb2-4141-ac08-dd091b095706",
    "barcode": "LIB-2024-00001",
    "rfid": null,
    "branchId": "67e3b721-a2c4-474d-8f7c-58653dba8bce",
    "shelfLocationId": "ddf730e9-bbdc-4cca-a4ed-3e0c2d266930",
    "status": "AVAILABLE"
  }
}
---

### 2.5 Tìm kiếm sách
```
GET /api/catalog?q=NestJS&page=1&limit=10
```
> Không cần token

---

## BƯỚC 3 – 👥 Membership: Tạo Bạn đọc

### 3.1 Đăng ký bạn đọc mới
```
POST /api/membership/readers
Content-Type: application/json
```
```json
{
  "fullName": "Nguyễn Văn An",
  "dateOfBirth": "1995-06-15",
  "email": "nguyenvana@gmail.com",
  "phone": "+84912345678",
  "identityNumber": "ABC123456",
  "address": "123 Phố Huế, Hai Bà Trưng, Hà Nội",
  "username": "nguyenvana",
  "initialPassword": "Password123!",
  "cardValidityMonths": 12
}
```
📌 **Lưu lại `readerId`** và **`cardNumber`** từ response

---

Response 
{
  "success": true,
  "data": {
    "id": "6521afc6-226c-4609-87d9-8ffa5ebd2fba",
    "fullName": "Nguyễn Văn An",
    "dateOfBirth": "1995-06-15",
    "email": "nguyenvana@gmail.com",
    "phone": "+84912345678",
    "identityNumber": "ABC123456",
    "address": "123 Phố Huế, Hai Bà Trưng, Hà Nội",
    "status": "ACTIVE",
    "card": {
      "id": "a7f8de7a-497a-48cf-a4af-05b05d5b5abc",
      "cardNumber": "LIB-A7F8DE7A",
      "status": "ACTIVE",
      "issuedAt": "2026-07-04T20:02:09.899Z",
      "expiresAt": "2027-07-04T20:02:09.899Z",
      "lockReason": null
    }
  }
}
Resp

### 3.2 Xem thông tin bạn đọc
```
GET /api/membership/readers/{readerId}
Authorization: Bearer <accessToken>
```

---

### 3.3 Cập nhật hồ sơ bạn đọc
```
PATCH /api/membership/readers/{readerId}
Authorization: Bearer <accessToken>
Content-Type: application/json
```
```json
{
  "email": "nguyenvana.new@gmail.com",
  "phone": "+84987654321",
  "address": "456 Đường Láng, Đống Đa, Hà Nội"
}
```

---

### 3.4 Gia hạn thẻ thư viện
```
POST /api/membership/readers/{readerId}/renew
Authorization: Bearer <accessToken>
Content-Type: application/json
```
```json
{
  "validityMonths": 12
}
```

---

### 3.5 Khóa tài khoản bạn đọc
```
POST /api/membership/readers/{readerId}/lock
Authorization: Bearer <accessToken>
Content-Type: application/json
```
```json
{
  "reason": "Vi phạm nội quy thư viện - mang sách ra ngoài không đăng ký"
}
```

---

### 3.6 Mở khóa tài khoản
```
POST /api/membership/readers/{readerId}/unlock
Authorization: Bearer <accessToken>
Content-Type: application/json
```
```json
{
  "reason": "Đã xử lý vi phạm, cho phép sử dụng lại"
}
```

---

INSERT INTO loan_policies (
  id,
  max_active_items,
  loan_days,
  max_renewals,
  renewal_days,
  effective_from,
  is_active
)
VALUES (
  gen_random_uuid(),
  5,      -- tối đa 5 cuốn cùng lúc
  30,     -- mượn tối đa 30 ngày
  2,      -- được gia hạn tối đa 2 lần
  7,      -- mỗi lần gia hạn thêm 7 ngày
  NOW(),
  true
);
-- Kiểm tra
SELECT * FROM loan_policies;

## BƯỚC 4 – 📖 Circulation: Mượn & Trả Sách

### 4.1 Cho mượn sách (STAFF only)
```
POST /api/circulation/loans
Authorization: Bearer <accessToken>
Content-Type: application/json
```
> `cardNumber` = số thẻ của bạn đọc, `barcodes` = mã vạch sách
```json
{
  "cardNumber": "<cardNumber từ bước 3.1>",
  "barcodes": ["LIB-2024-00001"]
}
```
📌 **Lưu lại `loanId`** và **`loanItemId`** từ response
{
  "success": true,
  "data": {
    "id": "c918f95f-4a5f-42de-91cb-5af365af30c7",
    "readerId": "6521afc6-226c-4609-87d9-8ffa5ebd2fba",
    "cardId": "a7f8de7a-497a-48cf-a4af-05b05d5b5abc",
    "branchId": "67e3b721-a2c4-474d-8f7c-58653dba8bce",
    "staffId": "818e2af4-9ae6-4142-a8eb-2dee08dc2153",
    "borrowedAt": "2026-07-04T20:21:06.075Z",
    "items": [
      {
        "id": "a1fd9410-9126-44d3-8768-428a05f97d6b",
        "copyId": "3a095240-f501-4f2d-8242-8b8795fa6e07",
        "bookTitleId": "aa6d6762-1fb2-4141-ac08-dd091b095706",
        "dueAt": "2026-08-03T20:21:06.075Z",
        "status": "ON_LOAN",
        "returnedAt": null,
        "returnCondition": null,
        "overdueDays": 0,
        "renewalCount": 0
      }
    ],
    "status": "OPEN"
  }
}
---

### 4.2 Xem danh sách sách đang mượn
```
GET /api/circulation/readers/{readerId}/loans
Authorization: Bearer <accessToken>
```

---

### 4.3 Gia hạn mượn sách
```
POST /api/circulation/loans/{loanId}/renew
Authorization: Bearer <accessToken>
Content-Type: application/json
```
```json
{
  "itemIds": ["<loanItemId từ bước 4.1>"]
}
```

---

### 4.4 Trả sách (STAFF only)
```
POST /api/circulation/returns
Authorization: Bearer <accessToken>
Content-Type: application/json
```
```json
{
  "returns": [
    {
      "barcode": "LIB-2024-00001",
      "condition": "NORMAL"
    }
  ]
}
```
> `condition` có thể là: `NORMAL` | `DAMAGED` | `LOST`

---

## BƯỚC 5 – 🔖 Reservation: Đặt trước Sách
INSERT INTO reservation_policies (
  id, 
  max_active_reservations,  -- tối đa bao nhiêu đặt trước cùng lúc/người
  hold_hours,               -- giữ sách bao nhiêu giờ sau khi có sách
  effective_from,           -- policy có hiệu lực từ khi nào
  is_active                 -- policy nào đang được áp dụng
)
VALUES (gen_random_uuid(), 3, 48, NOW(), true);
> ⚠️ Cần có **Reservation Policy** trong DB trước. Xem ghi chú cuối.

### 5.1 Đặt trước sách
```
POST /api/reservations
Authorization: Bearer <accessToken>
Content-Type: application/json
```
```json
{
  "bookTitleId": "<id từ bước 2.3>",
  "branchId": "<id từ bước 2.1>"
}
```
📌 **Lưu lại `reservationId`**

---
{
  "success": true,
  "data": {
    "id": "41b9c22a-6f3d-4d52-934f-990fda3292fc",
    "readerId": "6521afc6-226c-4609-87d9-8ffa5ebd2fba",
    "bookTitleId": "aa6d6762-1fb2-4141-ac08-dd091b095706",
    "branchId": "67e3b721-a2c4-474d-8f7c-58653dba8bce",
    "status": "ON_HOLD",
    "copyId": "3a095240-f501-4f2d-8242-8b8795fa6e07",
    "holdExpiresAt": "2026-07-06T20:36:39.477Z",
    "cancelReason": null,
    "createdAt": "2026-07-04T20:36:39.467Z"
  }
### 5.2 Xem danh sách đặt trước của bạn đọc
```
GET /api/reservations/readers/{readerId}
Authorization: Bearer <accessToken>
```

---

### 5.3 Hủy đặt trước
```
POST /api/reservations/{reservationId}/cancel
Authorization: Bearer <accessToken>
Content-Type: application/json
```
```json
{
  "reason": "Tôi không cần sách này nữa"
}
```

---

## BƯỚC 6 – 💰 Billing: Phí phạt & Thanh toán
-- Thêm Fine Policy (chính sách phạt)
INSERT INTO fine_policies (
  id,
  overdue_per_day,   -- phí phạt mỗi ngày quá hạn (VND)
  damaged_amount,    -- phí đền sách hỏng
  lost_amount,       -- phí đền sách mất
  effective_from,
  is_active
)
VALUES (
  gen_random_uuid(),
  5000,      -- 5.000đ/ngày quá hạn
  200000,    -- 200.000đ nếu làm hỏng
  500000,    -- 500.000đ nếu làm mất
  NOW(),
  true
);

-- Kiểm tra
SELECT * FROM fine_policies;

### 6.1 Tính phí phạt quá hạn (STAFF only)
```
POST /api/billing/fines/calculate
Authorization: Bearer <accessToken>
Content-Type: application/json
```
```json
{
  "loanItemId": "a1fd9410-9126-44d3-8768-428a05f97d6b"
}
```

Giả lập trường hợp quá hạn để chạy được API này
---

{
  "success": true,
  "data": [
    {
      "id": "1256fc70-eee4-443c-b3d7-8eec629fa72b",  <--- save loanFineId từ đây để thanh toán
      "readerId": "6521afc6-226c-4609-87d9-8ffa5ebd2fba",
      "loanId": "c918f95f-4a5f-42de-91cb-5af365af30c7",
      "loanItemId": "a1fd9410-9126-44d3-8768-428a05f97d6b",
      "reason": "OVERDUE",
      "amount": 25000,
      "createdAt": "2026-07-04T20:43:55.961Z",
      "status": "UNPAID",
      "pendingPaymentId": null,
      "paidAt": null
    }
  ]
}

### 6.2 Xem danh sách phí phạt của bạn đọc
```
GET /api/billing/fines/readers/{readerId}
Authorization: Bearer <accessToken>
```

---

### 6.3 Tạo thanh toán
```
POST /api/billing/payments
Authorization: Bearer <accessToken>
Content-Type: application/json
```
```json
{
  "readerId": "<readerId>",
  "fineIds": ["<fineId từ bước 6.1>"],
  "method": "CASH"
}
```
> `method`: `CASH` | `BANK_TRANSFER` | `ONLINE`

---

## 📋 Ghi chú quan trọng

### ❗ Tạo Admin/Staff để test
DB đang trống, cần insert admin trực tiếp vào DB. Vào pgAdmin (http://localhost:5050) và chạy SQL:

```sql
-- Tạo tài khoản admin (password: Admin@2024)
INSERT INTO user_accounts (id, username, password_hash, role, is_active)
VALUES (
  gen_random_uuid(),
  'admin',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGX.7.Jm.1Ij5FWJgFJXgBJaGS',
  'ADMIN',
  true
);
```
> Hoặc đổi password hash phù hợp với bcrypt rounds=12

### ❗ Thêm Reservation Policy
```sql
INSERT INTO reservation_policies (id, max_active_reservations, hold_hours, effective_from, is_active)
VALUES (gen_random_uuid(), 3, 48, NOW(), true);
```

### ❗ Thứ tự ID cần lưu lại
| Bước | Lưu lại |
|------|---------|
| 2.1 | `branchId` |
| 2.2 | `shelfId` |
| 2.3 | `bookTitleId` |
| 2.4 | `barcode` = `LIB-2024-00001` |
| 3.1 | `readerId`, `cardNumber` |
| 4.1 | `loanId`, `loanItemId` |
| 5.1 | `reservationId` |
| 6.1 | `fineId` |
