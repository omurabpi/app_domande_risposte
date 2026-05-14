-- ============================================
-- Schema SQL Server — App Domande Ometec
-- ============================================
-- Eseguire questo script sul database indicato in .env

-- Tabella utenti admin
CREATE TABLE admin_users (
    id           INT IDENTITY(1,1) PRIMARY KEY,
    username     NVARCHAR(100) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    created_at   DATETIME2 NOT NULL DEFAULT GETDATE()
);

-- Tabella domande
CREATE TABLE questions (
    id             INT IDENTITY(1,1) PRIMARY KEY,
    text           NVARCHAR(1000) NOT NULL,
    is_read        BIT NOT NULL DEFAULT 0,
    is_highlighted BIT NOT NULL DEFAULT 0,
    is_public      BIT NOT NULL DEFAULT 0,
    created_at     DATETIME2 NOT NULL DEFAULT GETDATE()
);

-- ============================================
-- Crea il primo utente admin
-- ============================================
-- 1. Installa bcryptjs in un progetto Node.js temporaneo
-- 2. Genera l'hash con:
--      node -e "const b=require('bcryptjs'); b.hash('LA_TUA_PASSWORD',12).then(h=>console.log(h))"
-- 3. Incolla l'hash qui sotto

INSERT INTO admin_users (username, password_hash)
VALUES ('admin', '$INCOLLA_HASH_QUI$');

-- ============================================
-- Indici consigliati
-- ============================================
CREATE INDEX IX_questions_is_public ON questions (is_public);
CREATE INDEX IX_questions_created_at ON questions (created_at DESC);
