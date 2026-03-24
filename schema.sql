DROP TABLE IF EXISTS search_history;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS deals;
DROP TABLE IF EXISTS masters;

CREATE TABLE masters (
  master_id TEXT PRIMARY KEY,
  brand_name TEXT,
  product_name TEXT,
  standard_capacity TEXT,
  barcode_number TEXT,
  thumbnail TEXT,
  category TEXT
);

CREATE TABLE deals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  master_id TEXT,
  mall_name TEXT,
  name TEXT,
  rawPrice INTEGER,
  isWow BOOLEAN,
  isNaverFresh BOOLEAN,
  hasShinsegaeCoupon BOOLEAN,
  category TEXT,
  FOREIGN KEY(master_id) REFERENCES masters(master_id)
);

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE search_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  search_query TEXT NOT NULL,
  thumbnail TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO masters (master_id, brand_name, product_name, standard_capacity, barcode_number, thumbnail, category) VALUES
  ('M1001', '제주삼다수', '삼다수', '2L', '8801234567890', '💧', 'drink'),
  ('M1002', 'CJ제일제당', '햇반', '210g', '8800987654321', '🍚', 'fresh'),
  ('M1003', '유한킴벌리', '크리넥스 3겹 데코앤소프트', '30m', '8801122334455', '🧻', 'living'),
  ('M1004', '코카콜라', '코카콜라 클래식', '1.5L', '8801056020026', '🥤', 'drink'),
  ('M1005', '서울우유', '서울우유 나100%', '1L', '8801115111030', '🥛', 'drink');

INSERT INTO deals (master_id, mall_name, name, rawPrice, isWow, isNaverFresh, hasShinsegaeCoupon, category) VALUES
  ('M1001', '쿠팡 로켓배송', '제주 삼다수 2L x 6개', 5900, 1, 0, 0, 'drink'),
  ('M1001', '네이버 장보기', '동원 무라벨 제주삼다수 2L 12개', 11500, 0, 1, 0, 'drink'),
  ('M1001', 'SSG 쓱배송', '[이마트] 삼다수 2L 6개입', 6200, 0, 0, 1, 'drink'),
  ('M1002', '쿠팡 로켓배송', 'CJ 햇반 210g x 12개', 14500, 1, 0, 0, 'fresh'),
  ('M1002', '네이버 장보기', '햇반 백미 210g 24개', 28000, 0, 1, 0, 'fresh'),
  ('M1003', 'SSG 쓱배송', '크리넥스 데코앤소프트 30m 30롤', 21900, 0, 0, 1, 'living'),
  ('M1004', '쿠팡 로켓배송', '코카콜라 1.5L x 12개', 24900, 1, 0, 0, 'drink'),
  ('M1004', '네이버 장보기', '코카콜라 1.5L 6개', 13500, 0, 1, 0, 'drink'),
  ('M1005', 'SSG 쓱배송', '서울우유 나100% 1L 2개', 5900, 0, 0, 1, 'drink'),
  ('M1005', '쿠팡 로켓프레시', '[냉장] 서울우유 1L x 4개', 11500, 1, 0, 0, 'drink');
