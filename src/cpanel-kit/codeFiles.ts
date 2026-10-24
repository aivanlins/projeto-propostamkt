/**
 * Arquivos de Arquitetura e Código de Produção para Hospedagem cPanel (PHP / MySQL)
 * Sistema de Gestão de Propostas Comerciais White-Label
 */

export const SQL_SCHEMA_CONTENT = `-- ========================================================================
-- BANCO DE DADOS DE ALTA SEGURANÇA (cPanel / MySQL 8+)
-- Arquitetura Relacional com Blindagem de Dados, Índices e Chaves Estrangeiras
-- Charset: utf8mb4 | Collation: utf8mb4_unicode_ci | Engine: InnoDB
-- ========================================================================

CREATE DATABASE IF NOT EXISTS propostas_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE propostas_db;

-- ------------------------------------------------------------------------
-- 1. TABELA DE USUÁRIOS E CONTROLE DE ACESSO (ACL)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL COMMENT 'Argon2id ou Bcrypt cost 12+',
    papel ENUM('admin', 'gestor', 'visualizador') NOT NULL DEFAULT 'gestor',
    status ENUM('ativo', 'bloqueado') NOT NULL DEFAULT 'ativo',
    tentativas_falhas TINYINT UNSIGNED NOT NULL DEFAULT 0,
    bloqueado_ate DATETIME NULL,
    token_recuperacao VARCHAR(64) NULL,
    expira_recuperacao DATETIME NULL,
    ultimo_login DATETIME NULL,
    ultimo_ip VARCHAR(45) NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_usuarios_email (email),
    INDEX idx_usuarios_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- 2. TABELA DE CONFIGURAÇÕES FIXAS (CMS DA AGÊNCIA)
-- Registro único (Singleton ID=1) com dados globais editáveis via painel
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS configuracoes_fixas (
    id TINYINT UNSIGNED PRIMARY KEY DEFAULT 1,
    nome_agencia VARCHAR(150) NOT NULL DEFAULT 'Minha Agência',
    slogan VARCHAR(255) NOT NULL DEFAULT 'Estratégias de Alto Impacto e Performance Escalável',
    cnpj VARCHAR(20) NOT NULL,
    email_contato VARCHAR(180) NOT NULL,
    telefone_whatsapp VARCHAR(30) NOT NULL,
    endereco VARCHAR(255) NOT NULL,
    logo_path VARCHAR(255) NULL,
    cor_primaria VARCHAR(7) NOT NULL DEFAULT '#4F46E5',
    cor_secundaria VARCHAR(7) NOT NULL DEFAULT '#0EA5E9',
    termos_garantia MEDIUMTEXT NOT NULL,
    dados_bancarios_pix TEXT NOT NULL,
    texto_rodape VARCHAR(255) NOT NULL,
    redes_sociais JSON NULL,
    atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_singleton CHECK (id = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- 3. TABELA DE PROPOSTAS COMERCIAIS
-- Armazena o token criptográfico público (64 chars hex) e a data de validade
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS propostas (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(64) NOT NULL UNIQUE COMMENT 'Hash seguro de 256 bits para acesso público via URL',
    titulo VARCHAR(200) NOT NULL,
    cliente_nome VARCHAR(120) NOT NULL,
    cliente_empresa VARCHAR(150) NOT NULL,
    cliente_email VARCHAR(180) NOT NULL,
    cliente_telefone VARCHAR(30) NOT NULL,
    cliente_documento VARCHAR(25) NOT NULL COMMENT 'CNPJ ou CPF formatado',
    apresentacao LONGTEXT NOT NULL,
    objetivos_json JSON NULL COMMENT 'Array de strings com os objetivos estratégicos',
    valor_total DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    desconto_aplicado DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    condicoes_pagamento TEXT NOT NULL,
    parcelamento_max TINYINT UNSIGNED NOT NULL DEFAULT 1,
    data_emissao DATETIME NOT NULL,
    data_validade DATETIME NOT NULL COMMENT 'Data e hora limite de vigência da proposta',
    status ENUM('rascunho', 'ativo', 'inativo', 'expirado', 'aceito', 'recusado') NOT NULL DEFAULT 'ativo',
    visualizacoes INT UNSIGNED NOT NULL DEFAULT 0,
    ultimo_acesso DATETIME NULL,
    ip_ultimo_acesso VARCHAR(45) NULL,
    observacoes_finais TEXT NULL,
    criado_por BIGINT UNSIGNED NOT NULL,
    aceite_data DATETIME NULL,
    aceite_responsavel VARCHAR(150) NULL,
    aceite_ip VARCHAR(45) NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (criado_por) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_propostas_token (token),
    INDEX idx_propostas_status (status),
    INDEX idx_propostas_validade (data_validade),
    INDEX idx_propostas_cliente (cliente_empresa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- 4. TABELA DE ENTREGÁVEIS / ITENS DO ESCOPO DA PROPOSTA
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS propostas_entregaveis (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    proposta_id BIGINT UNSIGNED NOT NULL,
    titulo VARCHAR(180) NOT NULL,
    descricao TEXT NOT NULL,
    quantidade DECIMAL(8, 2) NOT NULL DEFAULT 1.00,
    valor_unitario DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    prazo_estimado VARCHAR(80) NOT NULL,
    categoria VARCHAR(60) NULL,
    ordem_exibicao TINYINT UNSIGNED NOT NULL DEFAULT 0,
    
    FOREIGN KEY (proposta_id) REFERENCES propostas(id) ON UPDATE CASCADE ON DELETE CASCADE,
    INDEX idx_entregaveis_proposta (proposta_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- 5. TABELA DE AUDITORIA E LOGS DE SEGURANÇA (OWASP A10)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS propostas_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    proposta_id BIGINT UNSIGNED NULL,
    usuario_id BIGINT UNSIGNED NULL,
    acao ENUM('CRIACAO', 'EDICAO', 'EXCLUSAO', 'ATIVACAO', 'DESATIVACAO', 'VISUALIZACAO', 'EXPIRACAO_BLOQUEIO', 'ACEITE_CLIENTE', 'EXPORTACAO_PDF') NOT NULL,
    detalhes VARCHAR(500) NOT NULL,
    ip VARCHAR(45) NOT NULL,
    user_agent VARCHAR(300) NOT NULL,
    status_seguranca ENUM('OK', 'ALERTA', 'BLOQUEIO') NOT NULL DEFAULT 'OK',
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (proposta_id) REFERENCES propostas(id) ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE SET NULL,
    INDEX idx_logs_proposta (proposta_id),
    INDEX idx_logs_data (criado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- SEEDS INICIAIS (CONFIGURAÇÕES FIXAS DA AGÊNCIA)
-- ------------------------------------------------------------------------
INSERT INTO configuracoes_fixas (
    id, nome_agencia, slogan, cnpj, email_contato, telefone_whatsapp, 
    endereco, cor_primaria, cor_secundaria, termos_garantia, dados_bancarios_pix, texto_rodape
) VALUES (
    1,
    'Minha Agência',
    'Estratégias de Alto Impacto, Branding e Performance Escalável',
    '00.000.000/0001-00',
    'contato@suaagencia.com.br',
    '+55 (11) 99999-8888',
    'Brasil',
    '#4F46E5',
    '#0EA5E9',
    'Garantia de conformidade contratual e propriedade intelectual após quitação integral.',
    'Chave PIX: financeiro@suaagencia.com.br',
    '© 2026. Documento protegido e confidencial.'
) ON DUPLICATE KEY UPDATE atualizado_em = NOW();
`;

export const PHP_CONTROLLER_CONTENT = `<?php
/**
 * ========================================================================
 * CONTROLLER DE PROPOSTAS COMERCIAIS
 * Arquivo: controllers/PropostaController.php
 * Responsabilidade: Lógica de Validação de URL, Expiração e Controle de Status
 * Blindagem: PDO Prepared Statements, Prevenção contra Timing Attacks & XSS
 * ========================================================================
 */

declare(strict_types=1);

namespace App\\Controllers;

use PDO;
use Exception;
use App\\Config\\Database;
use App\\Security\\Security;

class PropostaController
{
    private PDO $pdo;

    public function __construct()
    {
        $this->pdo = Database::getInstance()->getConnection();
    }

    /**
     * Valida o acesso público à proposta a partir do token da URL
     * Executa a regra rigorosa de expiração e status ativo/inativo
     *
     * @param string $token Token de 64 caracteres hexadecimais
     * @return array [status => string, proposta => array|null, mensagem => string]
     */
    public function validarAcessoPorToken(string $token): array
    {
        // 1. Sanitização estrita do Token: aceita apenas caracteres hexadecimais de 64 chars
        $token = trim($token);
        if (!preg_match('/^[a-f0-9]{64}$/i', $token)) {
            $this->registrarTentativaSuspeita($token, 'TOKEN_FORMATO_INVALIDO');
            return [
                'valido' => false,
                'codigo_http' => 400,
                'motivo' => 'TOKEN_INVALIDO',
                'mensagem' => 'O formato do link de acesso fornecido é inválido.',
                'proposta' => null
            ];
        }

        // 2. Consulta blindada com Prepared Statement (Imune a SQL Injection)
        // Comparação de validade efetuada diretamente no fuso horário do banco de dados (NOW())
        $sql = "SELECT 
                    p.*,
                    cfg.nome_agencia,
                    cfg.slogan,
                    cfg.cnpj AS agencia_cnpj,
                    cfg.email_contato AS agencia_email,
                    cfg.telefone_whatsapp AS agencia_whatsapp,
                    cfg.endereco AS agencia_endereco,
                    cfg.cor_primaria,
                    cfg.cor_secundaria,
                    cfg.termos_garantia,
                    cfg.dados_bancarios_pix,
                    (p.data_validade < NOW()) AS is_expirada,
                    TIMESTAMPDIFF(SECOND, NOW(), p.data_validade) AS segundos_restantes
                FROM propostas p
                LEFT JOIN configuracoes_fixas cfg ON cfg.id = 1
                WHERE p.token = :token
                LIMIT 1";

        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':token', $token, PDO::PARAM_STR);
        $stmt->execute();
        $proposta = $stmt->fetch();

        // 3. Proposta não encontrada no banco
        if (!$proposta) {
            $this->registrarTentativaSuspeita($token, 'PROPOSTA_NAO_ENCONTRADA');
            return [
                'valido' => false,
                'codigo_http' => 404,
                'motivo' => 'NAO_ENCONTRADA',
                'mensagem' => 'Proposta comercial não localizada em nossa base de dados.',
                'proposta' => null
            ];
        }

        $ipVisitante = Security::obterIpReal();
        $userAgent = mb_substr($_SERVER['HTTP_USER_AGENT'] ?? 'Desconhecido', 0, 300);

        // 4. Verificação de status desativado manualmente pelo gestor
        if ($proposta['status'] === 'inativo') {
            $this->gravarLogAuditoria(
                (int)$proposta['id'], 
                'VISUALIZACAO', 
                'Tentativa de acesso a link desativado manualmente.', 
                $ipVisitante, 
                $userAgent, 
                'ALERTA'
            );

            return [
                'valido' => false,
                'codigo_http' => 403,
                'motivo' => 'LINK_INATIVO',
                'mensagem' => 'Este link de proposta comercial foi temporariamente suspenso pela agência emissora.',
                'proposta' => $proposta
            ];
        }

        // 5. Verificação cronológica de EXPIRAÇÃO (data_validade < NOW())
        if ((int)$proposta['is_expirada'] === 1 || $proposta['status'] === 'expirado') {
            // Se o status da tabela ainda não estiver como 'expirado', atualiza atomicamente
            if ($proposta['status'] !== 'expirado') {
                $upStmt = $this->pdo->prepare("UPDATE propostas SET status = 'expirado', atualizado_em = NOW() WHERE id = :id");
                $upStmt->execute([':id' => $proposta['id']]);
                $proposta['status'] = 'expirado';
            }

            $this->gravarLogAuditoria(
                (int)$proposta['id'], 
                'EXPIRACAO_BLOQUEIO', 
                'Acesso bloqueado: Proposta expirou em ' . $proposta['data_validade'], 
                $ipVisitante, 
                $userAgent, 
                'ALERTA'
            );

            return [
                'valido' => false,
                'codigo_http' => 410, // 410 Gone: recurso expirado permanentemente
                'motivo' => 'EXPIRADA',
                'mensagem' => 'O prazo de vigência desta proposta comercial expirou.',
                'data_validade' => $proposta['data_validade'],
                'proposta' => $proposta
            ];
        }

        // 6. Proposta VÁLIDA: Atualização de visualizações e auditoria
        $updateView = $this->pdo->prepare("
            UPDATE propostas 
            SET visualizacoes = visualizacoes + 1,
                ultimo_acesso = NOW(),
                ip_ultimo_acesso = :ip
            WHERE id = :id
        ");
        $updateView->execute([
            ':ip' => $ipVisitante,
            ':id' => $proposta['id']
        ]);

        // Carrega os entregáveis vinculados com Prepared Statement
        $stmtEntregaveis = $this->pdo->prepare("
            SELECT * FROM propostas_entregaveis 
            WHERE proposta_id = :proposta_id 
            ORDER BY ordem_exibicao ASC, id ASC
        ");
        $stmtEntregaveis->execute([':proposta_id' => $proposta['id']]);
        $proposta['entregaveis'] = $stmtEntregaveis->fetchAll();

        // Registro de log de auditoria
        $this->gravarLogAuditoria(
            (int)$proposta['id'],
            'VISUALIZACAO',
            'Visualização pública autenticada com sucesso. Validade confirmada.',
            $ipVisitante,
            $userAgent,
            'OK'
        );

        return [
            'valido' => true,
            'codigo_http' => 200,
            'motivo' => 'OK',
            'mensagem' => 'Proposta comercial ativa e válida.',
            'proposta' => $proposta
        ];
    }

    /**
     * Alterna o status da proposta entre 'ativo' e 'inativo' (Ação rápida no Admin)
     */
    public function alternarStatus(int $propostaId, string $novoStatus, int $usuarioId): bool
    {
        if (!in_array($novoStatus, ['ativo', 'inativo', 'expirado', 'aceito', 'recusado'], true)) {
            throw new Exception('Status inválido informado.');
        }

        $stmt = $this->pdo->prepare("
            UPDATE propostas 
            SET status = :status, atualizado_em = NOW() 
            WHERE id = :id
        ");
        $sucesso = $stmt->execute([
            ':status' => $novoStatus,
            ':id' => $propostaId
        ]);

        if ($sucesso) {
            $acao = ($novoStatus === 'ativo') ? 'ATIVACAO' : 'DESATIVACAO';
            $this->gravarLogAuditoria(
                $propostaId, 
                $acao, 
                "Status alterado para {$novoStatus} pelo usuário ID {$usuarioId}", 
                Security::obterIpReal(), 
                $_SERVER['HTTP_USER_AGENT'] ?? '', 
                'OK', 
                $usuarioId
            );
        }

        return $sucesso;
    }

    private function gravarLogAuditoria(int $propostaId, string $acao, string $detalhes, string $ip, string $ua, string $statusSeg, ?int $usrId = null): void
    {
        $sql = "INSERT INTO propostas_logs (proposta_id, usuario_id, acao, detalhes, ip, user_agent, status_seguranca, criado_em)
                VALUES (:pid, :uid, :acao, :detalhes, :ip, :ua, :status_seg, NOW())";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            ':pid' => $propostaId,
            ':uid' => $usrId,
            ':acao' => $acao,
            ':detalhes' => mb_substr($detalhes, 0, 500),
            ':ip' => $ip,
            ':ua' => mb_substr($ua, 0, 300),
            ':status_seg' => $statusSeg
        ]);
    }

    private function registrarTentativaSuspeita(string $token, string $motivo): void
    {
        $sql = "INSERT INTO propostas_logs (proposta_id, acao, detalhes, ip, user_agent, status_seguranca, criado_em)
                VALUES (NULL, 'EXPIRACAO_BLOQUEIO', :detalhes, :ip, :ua, 'BLOQUEIO', NOW())";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            ':detalhes' => "Tentativa suspeita: {$motivo} com token [" . mb_substr($token, 0, 16) . "...]",
            ':ip' => Security::obterIpReal(),
            ':ua' => mb_substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 300)
        ]);
    }
}
`;

export const PHP_SECURITY_CONTENT = `<?php
/**
 * ========================================================================
 * NÚCLEO DE SEGURANÇA CORPORATIVA
 * Arquivo: classes/Security.php
 * Blindagem: Anti-CSRF, Anti-XSS, Validação MIME Rigorosa, Prevenção Brute-Force
 * ========================================================================
 */

declare(strict_types=1);

namespace App\\Security;

use Exception;

class Security
{
    /**
     * Sanitização estrita contra XSS em outputs HTML (Templates)
     */
    public static function escape(?string $valor): string
    {
        if ($valor === null) return '';
        return htmlspecialchars($valor, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    /**
     * Gera Token Anti-CSRF criptograficamente seguro e armazena na Sessão
     */
    public static function gerarTokenCsrf(): string
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        if (empty($_SESSION['csrf_token']) || (isset($_SESSION['csrf_token_expira']) && $_SESSION['csrf_token_expira'] < time())) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
            $_SESSION['csrf_token_expira'] = time() + 7200; // Validade de 2 horas
        }

        return $_SESSION['csrf_token'];
    }

    /**
     * Valida Token Anti-CSRF usando hash_equals para evitar Timing Attacks
     */
    public static function validarTokenCsrf(?string $tokenRecebido): bool
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        if (empty($tokenRecebido) || empty($_SESSION['csrf_token'])) {
            return false;
        }

        return hash_equals($_SESSION['csrf_token'], $tokenRecebido);
    }

    /**
     * Validação estrita de upload de imagens (Logos e Banners)
     * Verifica Extensão real, MIME-type por magic bytes e tamanho máximo
     */
    public static function validarEProcessarUpload(array $file, string $diretorioDestino): string
    {
        $maxTamanho = 3 * 1024 * 1024; // 3MB
        $mimePermitidos = [
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp',
            'image/svg+xml' => 'svg'
        ];

        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new Exception('Erro durante a transmissão do arquivo.');
        }

        if ($file['size'] > $maxTamanho) {
            throw new Exception('Arquivo excede o limite máximo permitido de 3MB.');
        }

        // Inspeção de MIME-type real através da biblioteca Fileinfo (magic bytes)
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeReal = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        if (!array_key_exists($mimeReal, $mimePermitidos)) {
            throw new Exception("Tipo de arquivo não permitido ({$mimeReal}). Apenas JPG, PNG, WEBP e SVG são válidos.");
        }

        // Gera nome aleatório único para neutralizar execução de scripts maliciosos (.php.jpg)
        $extensaoSegura = $mimePermitidos[$mimeReal];
        $novoNome = 'logo_' . bin2hex(random_bytes(16)) . '.' . $extensaoSegura;
        $caminhoCompleto = rtrim($diretorioDestino, '/') . '/' . $novoNome;

        if (!move_uploaded_file($file['tmp_name'], $caminhoCompleto)) {
            throw new Exception('Falha ao salvar arquivo no servidor.');
        }

        return $novoNome;
    }

    /**
     * Recupera o IP real do cliente considerando Cloudflare / Proxy Reverso seguro
     */
    public static function obterIpReal(): string
    {
        if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
            return filter_var($_SERVER['HTTP_CF_CONNECTING_IP'], FILTER_VALIDATE_IP) ?: '0.0.0.0';
        }
        if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
            $ip = trim($ips[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP)) return $ip;
        }
        return filter_var($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0', FILTER_VALIDATE_IP) ?: '0.0.0.0';
    }

    /**
     * Emite cabeçalhos HTTP de segurança estritos (Defense in Depth)
     */
    public static function aplicarCabecalhosSeguranca(): void
    {
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: SAMEORIGIN');
        header('X-XSS-Protection: 1; mode=block');
        header('Referrer-Policy: strict-origin-when-cross-origin');
        header("Content-Security-Policy: default-src 'self' https: data: 'unsafe-inline'; img-src 'self' https: data: blob:;");
    }
}
`;

export const PHP_DATABASE_CONTENT = `<?php
/**
 * ========================================================================
 * CONEXÃO SEGURA PDO (SINGLETON)
 * Arquivo: config/database.php
 * Blindagem: Desativação de Prepared Statements Emulados, Erros Silenciosos
 * ========================================================================
 */

declare(strict_types=1);

namespace App\\Config;

use PDO;
use PDOException;
use Exception;

class Database
{
    private static ?Database $instance = null;
    private PDO $connection;

    private function __construct()
    {
        // Variáveis de ambiente ou arquivo .env protegido fora do public_html
        $host = getenv('DB_HOST') ?: '127.0.0.1';
        $db   = getenv('DB_NAME') ?: 'propostas_db';
        $user = getenv('DB_USER') ?: 'propostas_user';
        $pass = getenv('DB_PASS') ?: 'SENHA_FORTE_AQUI_CPA_NEL';
        $port = getenv('DB_PORT') ?: '3306';

        $dsn = "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4";

        $options = [
            // Lança exceções para tratamento limpo de erros
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            // Retorna arrays associativos por padrão
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            // CRÍTICO: Desativa emulação de prepares para garantir prepared statements nativos no MySQL
            PDO::ATTR_EMULATE_PREPARES   => false,
            // Força buffer de queries e charset seguro
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
        ];

        try {
            $this->connection = new PDO($dsn, $user, $pass, $options);
        } catch (PDOException $e) {
            // NUNCA exibe detalhes da string de conexão ou credenciais em tela
            error_log("[ERRO_BD_PROPOSTAS] " . $e->getMessage());
            throw new Exception('Erro ao conectar ao banco de dados corporativo.');
        }
    }

    public static function getInstance(): Database
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection(): PDO
    {
        return $this->connection;
    }

    // Previne clonagem e desserialização da instância singleton
    private function __clone() {}
    public function __wakeup() {
        throw new Exception("Não é permitido desserializar um Singleton.");
    }
}
`;

export const HTACCESS_CONTENT = `# ========================================================================
# DIRETIVAS DE SEGURANÇA APACHE (cPanel)
# Arquivo: .htaccess
# ========================================================================

# 1. Desativa listagem de diretórios (Directory Browsing)
Options -Indexes

# 2. Bloqueia acesso a arquivos sensíveis (.env, .git, .sql, .log)
<FilesMatch "^(\\.(env|git|htaccess)|.*\\.(sql|log|ini|sh|bak))$">
    Order allow,deny
    Deny from all
</FilesMatch>

# 3. Força HTTPS obrigatório (HSTS)
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# 4. Roteamento elegante de propostas: /proposta/{token} -> proposta.php?token={token}
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^proposta/([a-f0-9]{64})$ public/proposta.php?token=$1 [QSA,L]

# 5. Cabeçalhos de Segurança (HTTP Security Headers)
<IfModule mod_headers.c>
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Permissions-Policy "geolocation=(), microphone=(), camera=()"
</IfModule>
`;
