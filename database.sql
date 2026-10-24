
CREATE DATABASE IF NOT EXISTS gcstudio_propostas;
USE gcstudio_propostas;

CREATE TABLE IF NOT EXISTS configuracao_fixa (
    id VARCHAR(50) PRIMARY KEY,
    nome_agencia VARCHAR(255),
    email_contato VARCHAR(255),
    telefone_whatsapp VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS usuarios (
    id VARCHAR(50) PRIMARY KEY,
    nome VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    senha VARCHAR(255),
    papel VARCHAR(50)
);

-- Inserts iniciais (senha deve ser hash bcrypt)
INSERT INTO configuracao_fixa (id, nome_agencia, email_contato, telefone_whatsapp) 
VALUES ('cfg_gc_studio_01', 'GC Studio Marketing', 'comercial@gcstudiomarketing.com.br', '+55 12 98101-9913');
