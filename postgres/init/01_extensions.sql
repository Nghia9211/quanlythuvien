-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable unaccent for Vietnamese search (tìm kiếm không dấu)
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Enable pg_trgm for full-text / fuzzy search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
