-- Tạo schema riêng cho project (optional, dùng public cũng được)
-- Script này chạy 1 lần khi postgres container khởi tạo lần đầu

-- Extension hỗ trợ UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Extension hỗ trợ full-text search tiếng Việt (unaccent)
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Thông báo khởi tạo thành công
DO $$
BEGIN
  RAISE NOTICE 'DGM Library database initialized successfully';
END $$;
