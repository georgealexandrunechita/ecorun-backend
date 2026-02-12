USE ecorun_sevilla;

-- USERS
CREATE TABLE users (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  ecopoints INT DEFAULT 0,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RUNS  
CREATE TABLE runs (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  run_name VARCHAR(100) NOT NULL,
  distance_km DECIMAL(8,2) NOT NULL,
  duration_minutes INT NOT NULL,
  run_date DATETIME NOT NULL,
  points_earned INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Verificar
SHOW TABLES;
