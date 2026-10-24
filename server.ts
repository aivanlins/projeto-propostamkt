import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import multer from 'multer';

dotenv.config();

const app = express();
app.set('trust proxy', 1);

// IP real do cliente (atrás de proxy/cPanel)
function getIp(req: express.Request): string {
  return req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ?? req.ip ?? '0.0.0.0';
}
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCK_FILE = path.join(__dirname, 'installed.lock');
const DB_CONFIG_FILE = path.join(__dirname, 'db-config.json');

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Helper para obter credenciais do banco de dados (prioriza arquivo salvo na instalação)
function getDbConfig() {
  if (fs.existsSync(DB_CONFIG_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(DB_CONFIG_FILE, 'utf-8'));
      if (parsed && parsed.database) return parsed;
    } catch (e) {
      console.error('Erro ao ler db-config.json:', e);
    }
  }

  if (process.env.DB_NAME) {
    return {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME,
    };
  }

  return null;
}

// Migração segura: adiciona a coluna "slug" (URL amigável) em instalações antigas.
// Executa no máximo uma vez com sucesso por processo; falhas não interrompem o sistema.
let colunaSlugVerificada = false;
async function garantirColunaSlug(conn: any) {
  if (colunaSlugVerificada) return;
  try {
    const [cols]: any = await conn.query("SHOW COLUMNS FROM propostas LIKE 'slug'");
    if (!cols || cols.length === 0) {
      await conn.query('ALTER TABLE propostas ADD COLUMN slug VARCHAR(120) DEFAULT NULL');
    }
    colunaSlugVerificada = true;
  } catch (e: any) {
    console.error('Aviso: não foi possível verificar/criar a coluna slug em propostas:', e.message);
  }
}

async function getDbConnection() {
  const config = getDbConfig();
  if (!config) throw new Error('Banco de dados não configurado. Conclua a instalação.');
  return await mysql.createConnection({
    ...config,
    multipleStatements: true,
  });
}

// ==========================================
// 1. ENDPOINT DE DIAGNÓSTICO /api/check-db
// ==========================================
app.get('/api/check-db', async (req, res) => {
  try {
    const config = getDbConfig();
    if (!config) {
      return res.status(200).json({
        conectado: false,
        instalado: fs.existsSync(LOCK_FILE),
        mensagem: 'Nenhum arquivo db-config.json ou variável de ambiente encontrada.',
        tabelas: {}
      });
    }

    const conn = await mysql.createConnection(config);

    // Lista de tabelas esperadas
    const tabelasEsperadas = ['configuracao_fixa', 'usuarios', 'propostas', 'modelos_propostas', 'logs_auditoria'];
    const resultadoTabelas: Record<string, { existe: boolean; registros: number }> = {};

    for (const tab of tabelasEsperadas) {
      try {
        const [rows]: any = await conn.query(`SELECT COUNT(*) as total FROM \`${tab}\``);
        resultadoTabelas[tab] = { existe: true, registros: rows[0]?.total || 0 };
      } catch (err) {
        resultadoTabelas[tab] = { existe: false, registros: 0 };
      }
    }

    // Busca detalhes do primeiro admin se existir
    let adminInfo = null;
    try {
      const [adminRows]: any = await conn.query('SELECT id, nome, email, papel, criado_em FROM usuarios WHERE papel = "admin" LIMIT 1');
      if (adminRows && adminRows.length > 0) {
        adminInfo = adminRows[0];
      }
    } catch (e) {}

    await conn.end();

    const configuracaoOk = (resultadoTabelas['configuracao_fixa']?.registros || 0) > 0;
    const usuariosOk = (resultadoTabelas['usuarios']?.registros || 0) > 0;

    return res.json({
      conectado: true,
      instalado: fs.existsSync(LOCK_FILE),
      bancoNome: config.database,
      servidor: `${config.host}:${config.port || 3306}`,
      usuarioDb: config.user,
      configuracaoOk,
      usuariosOk,
      adminInfo,
      tabelas: resultadoTabelas,
      statusGeral: configuracaoOk && usuariosOk ? 'PRONTO_PARA_USO' : 'PENDENTE_DADOS'
    });
  } catch (err: any) {
    return res.status(200).json({
      conectado: false,
      instalado: fs.existsSync(LOCK_FILE),
      erro: err.message || 'Falha ao conectar no MySQL',
      tabelas: {}
    });
  }
});

// ==========================================
// 2. ROTAS DE INSTALAÇÃO DO SISTEMA
// ==========================================

// Testar conexão MySQL
app.post('/api/install/test-db', async (req, res) => {
  const { host, port, user, password, database } = req.body;
  try {
    const connection = await mysql.createConnection({
      host: host || 'localhost',
      port: parseInt(port, 10) || 3306,
      user,
      password,
      database
    });
    await connection.end();
    res.json({ success: true, message: 'Conexão estabelecida com sucesso com o servidor MySQL!' });
  } catch (err: any) {
    console.error('Erro no test-db:', err);
    res.status(500).json({ error: err.message || 'Falha ao conectar no MySQL.' });
  }
});

// Criar todas as tabelas necessárias no MySQL
app.post('/api/install/create-tables', async (req, res) => {
  const { host, port, user, password, database } = req.body;
  try {
    const dbParams = {
      host: host || 'localhost',
      port: parseInt(port, 10) || 3306,
      user,
      password,
      database,
      multipleStatements: true
    };

    const connection = await mysql.createConnection(dbParams);

    // Salvar arquivo de credenciais permanentemente
    fs.writeFileSync(DB_CONFIG_FILE, JSON.stringify(dbParams, null, 2));

    const schema = `
      CREATE TABLE IF NOT EXISTS configuracao_fixa (
        id VARCHAR(50) PRIMARY KEY,
        nome_agencia VARCHAR(255) DEFAULT 'Minha Agência',
        email_contato VARCHAR(255) DEFAULT '',
        telefone_whatsapp VARCHAR(50) DEFAULT '',
        dados_json LONGTEXT,
        atualizado_em VARCHAR(50)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      CREATE TABLE IF NOT EXISTS usuarios (
        id VARCHAR(50) PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        senha VARCHAR(255) NOT NULL,
        whatsapp VARCHAR(50) DEFAULT '',
        cargo VARCHAR(255) DEFAULT 'Consultor Comercial',
        foto_url TEXT,
        slug VARCHAR(255) DEFAULT '',
        papel VARCHAR(50) DEFAULT 'admin',
        status VARCHAR(50) DEFAULT 'ativo',
        ultimo_login VARCHAR(50),
        pode_criar_secoes TINYINT(1) DEFAULT 1,
        criado_em VARCHAR(50)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      CREATE TABLE IF NOT EXISTS propostas (
        id VARCHAR(50) PRIMARY KEY,
        token VARCHAR(100) NOT NULL UNIQUE,
        cliente_nome VARCHAR(255) NOT NULL,
        cliente_empresa VARCHAR(255) DEFAULT '',
        titulo VARCHAR(255) NOT NULL,
        slug VARCHAR(120) DEFAULT NULL,
        status VARCHAR(50) DEFAULT 'ativo',
        valor_total DECIMAL(10,2) DEFAULT 0.00,
        criado_por_id VARCHAR(50),
        criado_por_nome VARCHAR(255),
        dados_json LONGTEXT,
        criado_em VARCHAR(50),
        atualizado_em VARCHAR(50)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      CREATE TABLE IF NOT EXISTS modelos_propostas (
        id VARCHAR(50) PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        descricao TEXT,
        categoria VARCHAR(100) DEFAULT 'Geral',
        dados_json LONGTEXT,
        criado_em VARCHAR(50)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      CREATE TABLE IF NOT EXISTS logs_auditoria (
        id VARCHAR(50) PRIMARY KEY,
        proposta_id VARCHAR(50),
        proposta_titulo VARCHAR(255),
        usuario_id VARCHAR(50),
        usuario_nome VARCHAR(255) DEFAULT 'Sistema',
        acao VARCHAR(50) NOT NULL,
        detalhes TEXT,
        ip VARCHAR(50) DEFAULT '127.0.0.1',
        user_agent TEXT,
        status_seguranca VARCHAR(50) DEFAULT 'OK',
        data_hora VARCHAR(50)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.query(schema);

    // Insere linha padrão em configuracao_fixa caso não exista
    await connection.query(
      `INSERT IGNORE INTO configuracao_fixa (id, nome_agencia, email_contato, telefone_whatsapp, atualizado_em) 
       VALUES ('cfg_principal', 'Minha Agência', 'contato@suaagencia.com.br', '', ?)`,
      [new Date().toISOString()]
    );

    // Registra log da criação de tabelas
    await connection.query(
      `INSERT INTO logs_auditoria (id, usuario_nome, acao, detalhes, data_hora, ip) 
       VALUES (?, 'Instalador Automático', 'CRIACAO', 'Tabelas do sistema estruturadas no MySQL com sucesso.', ?, ?)`,
      [`log_${Date.now()}`, new Date().toISOString(), getIp(req)]
    );

    await connection.end();
    res.json({ success: true, message: 'Estrutura de tabelas criada com sucesso no MySQL!' });
  } catch (err: any) {
    console.error('Erro no create-tables:', err);
    res.status(500).json({ error: err.message || 'Falha ao criar tabelas no MySQL' });
  }
});

// Cadastrar Super Administrador e finalizar instalação
app.post('/api/install/create-admin', async (req, res) => {
  const { host, port, user, password, database, name, email, adminPassword } = req.body;
  try {
    let dbConfig = null;
    if (database && user) {
      dbConfig = {
        host: host || 'localhost',
        port: parseInt(port, 10) || 3306,
        user,
        password,
        database
      };
      fs.writeFileSync(DB_CONFIG_FILE, JSON.stringify(dbConfig, null, 2));
    } else {
      dbConfig = getDbConfig();
    }

    if (!dbConfig) {
      return res.status(500).json({ error: 'Configurações de conexão do MySQL não encontradas.' });
    }

    const connection = await mysql.createConnection(dbConfig);
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const agora = new Date().toISOString();

    // Insere ou atualiza o administrador com privilégios completos
    await connection.query(
      `INSERT INTO usuarios (id, nome, email, senha, papel, status, pode_criar_secoes, cargo, criado_em) 
       VALUES ('usr_admin', ?, ?, ?, 'admin', 'ativo', 1, 'Diretor Geral', ?)
       ON DUPLICATE KEY UPDATE nome = VALUES(nome), senha = VALUES(senha), papel = 'admin', status = 'ativo'`,
      [name || 'Administrador Geral', email, hashedPassword, agora]
    );

    // Registra log de instalação
    await connection.query(
      `INSERT INTO logs_auditoria (id, usuario_nome, acao, detalhes, data_hora, ip) 
       VALUES (?, ?, 'CRIACAO', 'Instalação do sistema finalizada. Super Administrador ativado.', ?, ?)`,
      [`log_${Date.now()}`, name || 'Super Admin', agora, getIp(req)]
    );

    await connection.end();

    // Cria a trava de segurança installed.lock
    fs.writeFileSync(LOCK_FILE, JSON.stringify({
      instaladoEm: agora,
      adminEmail: email,
      adminNome: name
    }, null, 2));

    res.json({ success: true, message: 'Super Administrador cadastrado e instalado com sucesso!' });
  } catch (err: any) {
    console.error('Erro no create-admin:', err);
    res.status(500).json({ error: err.message || 'Falha ao cadastrar o administrador.' });
  }
});

// ==========================================
// 3. ROTAS DE AUTENTICAÇÃO
// ==========================================

app.post('/api/login', async (req, res) => {
  const { email, senha } = req.body;
  try {
    const dbConfig = getDbConfig();
    if (!dbConfig) {
      return res.status(500).json({ 
        error: 'Configuração do banco de dados não encontrada no servidor. Conclua a instalação primeiro.',
        reinstalar: true 
      });
    }

    const connection = await mysql.createConnection(dbConfig);
    const [rows]: any = await connection.query('SELECT * FROM usuarios WHERE email = ?', [email]);

    if (!rows || rows.length === 0) {
      const [countRows]: any = await connection.query('SELECT COUNT(*) as total FROM usuarios');
      const total = countRows[0]?.total || 0;

      // Se a tabela estiver vazia, registra tentativa e avisa
      if (total === 0) {
        await connection.end();
        return res.status(401).json({
          error: 'A tabela de usuários está vazia. O administrador não foi inserido no banco de dados.',
          reinstalar: true
        });
      }

      // Log de falha de login
      await connection.query(
        `INSERT INTO logs_auditoria (id, usuario_nome, acao, detalhes, status_seguranca, data_hora, ip) 
         VALUES (?, ?, 'VISUALIZACAO', 'Tentativa de login com e-mail inexistente.', 'ALERTA', ?, ?)`,
        [`log_${Date.now()}`, email, new Date().toISOString(), getIp(req)]
      );
      await connection.end();

      return res.status(401).json({ error: 'E-mail não encontrado no banco de dados.' });
    }

    const user = rows[0];

    // Validação com bcrypt (com fallback caso senha em texto plano)
    let senhaValida = false;
    if (user.senha && (user.senha.startsWith('$2a$') || user.senha.startsWith('$2b$') || user.senha.startsWith('$2y$'))) {
      senhaValida = await bcrypt.compare(senha, user.senha);
    } else {
      senhaValida = user.senha === senha;
    }

    const agora = new Date().toISOString();

    if (!senhaValida) {
      await connection.query(
        `INSERT INTO logs_auditoria (id, usuario_id, usuario_nome, acao, detalhes, status_seguranca, data_hora, ip) 
         VALUES (?, ?, ?, 'VISUALIZACAO', 'Tentativa de login com senha incorreta.', 'ALERTA', ?, ?)`,
        [`log_${Date.now()}`, user.id, user.nome, agora, getIp(req)]
      );
      await connection.end();
      return res.status(401).json({ error: 'Senha incorreta.' });
    }

    if (user.status === 'bloqueado') {
      await connection.end();
      return res.status(403).json({ error: 'Conta de usuário desativada pelo administrador.' });
    }

    // Atualiza data do último login e registra log
    await connection.query('UPDATE usuarios SET ultimo_login = ? WHERE id = ?', [agora, user.id]);
    await connection.query(
      `INSERT INTO logs_auditoria (id, usuario_id, usuario_nome, acao, detalhes, data_hora, ip) 
       VALUES (?, ?, ?, 'ATIVACAO', 'Login bem-sucedido no painel de gestão.', ?, ?)`,
      [`log_${Date.now()}`, user.id, user.nome, agora, getIp(req)]
    );

    await connection.end();

    const { senha: _, ...userSafe } = user;
    return res.json({
      success: true,
      usuario: {
        id: userSafe.id || 'usr_admin',
        nome: userSafe.nome,
        email: userSafe.email,
        whatsapp: userSafe.whatsapp || '',
        cargo: userSafe.cargo || 'Administrador',
        slug: userSafe.slug || 'admin',
        papel: userSafe.papel || 'admin',
        status: userSafe.status || 'ativo',
        podeCriarSecoes: userSafe.pode_criar_secoes === 1 || userSafe.pode_criar_secoes === true,
      }
    });
  } catch (err: any) {
    console.error('Erro na rota /api/login:', err);
    return res.status(500).json({ error: 'Erro de comunicação com o MySQL: ' + (err.message || 'Falha de conexão') });
  }
});

// Resetar instalação
app.post('/api/reset-install', (req, res) => {
  try {
    if (fs.existsSync(LOCK_FILE)) fs.unlinkSync(LOCK_FILE);
    if (fs.existsSync(DB_CONFIG_FILE)) fs.unlinkSync(DB_CONFIG_FILE);
    res.json({ success: true, message: 'Instalação reiniciada. Travas removidas.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Status geral
app.get('/api/status', (req, res) => {
  res.json({ instalado: fs.existsSync(LOCK_FILE) });
});

// ==========================================
// 4. ROTAS DE DADOS PERSISTENTES (CONFIG, PROPOSTAS, LOGS, USUARIOS)
// ==========================================

// Configuração da Agência
app.get('/api/config', async (req, res) => {
  try {
    const conn = await getDbConnection();
    const [rows]: any = await conn.query('SELECT dados_json, nome_agencia, email_contato, telefone_whatsapp FROM configuracao_fixa LIMIT 1');
    await conn.end();

    if (rows && rows.length > 0 && rows[0].dados_json) {
      try {
        return res.json(JSON.parse(rows[0].dados_json));
      } catch (e) {}
    }
    return res.json(null);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/config', async (req, res) => {
  try {
    const novaConfig = req.body;
    const conn = await getDbConnection();
    const agora = new Date().toISOString();
    const jsonStr = JSON.stringify(novaConfig);

    await conn.query(
      `INSERT INTO configuracao_fixa (id, nome_agencia, email_contato, telefone_whatsapp, dados_json, atualizado_em) 
       VALUES ('cfg_principal', ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         nome_agencia = VALUES(nome_agencia),
         email_contato = VALUES(email_contato),
         telefone_whatsapp = VALUES(telefone_whatsapp),
         dados_json = VALUES(dados_json),
         atualizado_em = VALUES(atualizado_em)`,
      [
        novaConfig.nomeAgencia || 'Minha Agência',
        novaConfig.emailContato || '',
        novaConfig.telefoneWhatsapp || '',
        jsonStr,
        agora
      ]
    );

    await conn.query(
      `INSERT INTO logs_auditoria (id, usuario_nome, acao, detalhes, data_hora, ip) 
       VALUES (?, 'Admin', 'EDICAO', 'Configurações e identidade visual da agência atualizadas no banco.', ?, ?)`,
      [`log_${Date.now()}`, agora, getIp(req)]
    );

    await conn.end();
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Propostas Comerciais (CRUD completo)
app.get('/api/propostas', async (req, res) => {
  try {
    const conn = await getDbConnection();
    const [rows]: any = await conn.query('SELECT dados_json FROM propostas ORDER BY atualizado_em DESC');
    await conn.end();

    const propostas = (rows || []).map((r: any) => {
      try {
        return JSON.parse(r.dados_json);
      } catch (e) {
        return null;
      }
    }).filter(Boolean);

    return res.json(propostas);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/propostas', async (req, res) => {
  try {
    const proposta = req.body;
    const conn = await getDbConnection();
    const agora = new Date().toISOString();
    const jsonStr = JSON.stringify(proposta);
    await garantirColunaSlug(conn);

    await conn.query(
      `INSERT INTO propostas (id, token, cliente_nome, cliente_empresa, titulo, status, valor_total, criado_por_id, criado_por_nome, dados_json, criado_em, atualizado_em) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         cliente_nome = VALUES(cliente_nome),
         cliente_empresa = VALUES(cliente_empresa),
         titulo = VALUES(titulo),
         status = VALUES(status),
         valor_total = VALUES(valor_total),
         dados_json = VALUES(dados_json),
         atualizado_em = VALUES(atualizado_em)`,
      [
        proposta.id,
        proposta.token,
        proposta.clienteNome || 'Cliente',
        proposta.clienteEmpresa || '',
        proposta.titulo || 'Proposta Comercial',
        proposta.status || 'ativo',
        proposta.valorTotal || 0,
        proposta.criadoPorId || '',
        proposta.criadoPor || '',
        jsonStr,
        proposta.criadoEm || agora,
        agora
      ]
    );

    if (colunaSlugVerificada) {
      try {
        await conn.query('UPDATE propostas SET slug = ? WHERE id = ?', [proposta.slug || null, proposta.id]);
      } catch (e: any) {
        console.error('Aviso: falha ao gravar slug da proposta:', e.message);
      }
    }

    await conn.query(
      `INSERT INTO logs_auditoria (id, proposta_id, proposta_titulo, usuario_nome, acao, detalhes, data_hora, ip) 
       VALUES (?, ?, ?, ?, 'EDICAO', 'Proposta comercial salva/atualizada no MySQL.', ?, ?)`,
      [`log_${Date.now()}`, proposta.id, proposta.titulo, proposta.criadoPor || 'Admin', agora, getIp(req)]
    );

    await conn.end();
    return res.json({ success: true, proposta });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/propostas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const conn = await getDbConnection();
    await conn.query('DELETE FROM propostas WHERE id = ?', [id]);
    await conn.query(
      `INSERT INTO logs_auditoria (id, proposta_id, usuario_nome, acao, detalhes, status_seguranca, data_hora, ip) 
       VALUES (?, ?, 'Admin', 'EXCLUSAO', 'Proposta comercial excluída permanentemente.', 'ALERTA', ?, ?)`,
      [`log_${Date.now()}`, id, new Date().toISOString(), getIp(req)]
    );
    await conn.end();
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Consulta de proposta por token (link público de cliente)
app.get('/api/proposta/token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const conn = await getDbConnection();
    const [rows]: any = await conn.query('SELECT dados_json FROM propostas WHERE token = ? LIMIT 1', [token]);
    
    if (rows && rows.length > 0) {
      const prop = JSON.parse(rows[0].dados_json);
      // Registra visualização no log
      await conn.query(
        `INSERT INTO logs_auditoria (id, proposta_id, proposta_titulo, usuario_nome, acao, detalhes, data_hora, ip) 
         VALUES (?, ?, ?, 'Cliente Público', 'VISUALIZACAO', 'Acesso ao link público da proposta.', ?, ?)`,
        [`log_${Date.now()}`, prop.id, prop.titulo, new Date().toISOString(), getIp(req)]
      );
      await conn.end();
      return res.json(prop);
    }

    await conn.end();
    return res.status(404).json({ error: 'Proposta não encontrada.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Consulta de proposta pela URL amigável (/proposta-<slug>) — link público de cliente
app.get('/api/proposta/slug/:slug', async (req, res) => {
  try {
    const slug = String(req.params.slug || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!slug) return res.status(400).json({ error: 'URL inválida.' });

    const conn = await getDbConnection();
    await garantirColunaSlug(conn);

    let prop: any = null;
    if (colunaSlugVerificada) {
      const [rows]: any = await conn.query('SELECT dados_json FROM propostas WHERE slug = ? LIMIT 1', [slug]);
      if (rows && rows.length > 0) prop = JSON.parse(rows[0].dados_json);
    }
    if (!prop) {
      // Fallback: procura o slug dentro do JSON (propostas salvas antes da coluna existir)
      const [rows]: any = await conn.query('SELECT dados_json FROM propostas WHERE dados_json LIKE ?', [`%"slug":"${slug}"%`]);
      for (const r of rows || []) {
        try {
          const p = JSON.parse(r.dados_json);
          if (p && p.slug === slug) { prop = p; break; }
        } catch (e) {}
      }
    }

    if (!prop) {
      await conn.end();
      return res.status(404).json({ error: 'Proposta não encontrada.' });
    }

    await conn.query(
      `INSERT INTO logs_auditoria (id, proposta_id, proposta_titulo, usuario_nome, acao, detalhes, data_hora, ip) 
       VALUES (?, ?, ?, 'Cliente Público', 'VISUALIZACAO', 'Acesso ao link público da proposta (URL amigável).', ?, ?)`,
      [`log_${Date.now()}`, prop.id, prop.titulo, new Date().toISOString(), getIp(req)]
    );
    await conn.end();
    return res.json(prop);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Modelos de Propostas (CRUD completo)
app.get('/api/modelos', async (req, res) => {
  try {
    const conn = await getDbConnection();
    const [rows]: any = await conn.query('SELECT * FROM modelos_propostas ORDER BY criado_em DESC');
    await conn.end();

    const modelos = (rows || []).map((r: any) => {
      try {
        const parsed = JSON.parse(r.dados_json || '{}');
        return {
          id: r.id,
          titulo: r.titulo,
          descricao: r.descricao,
          categoria: r.categoria,
          criadoEm: r.criado_em,
          ...parsed,
        };
      } catch (e) {
        return {
          id: r.id,
          titulo: r.titulo,
          descricao: r.descricao,
          categoria: r.categoria,
          criadoEm: r.criado_em,
        };
      }
    });

    return res.json(modelos);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/modelos', async (req, res) => {
  try {
    const modelo = req.body;
    const conn = await getDbConnection();
    const agora = new Date().toISOString();
    const jsonStr = JSON.stringify(modelo);

    await conn.query(
      `INSERT INTO modelos_propostas (id, titulo, descricao, categoria, dados_json, criado_em)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         titulo = VALUES(titulo),
         descricao = VALUES(descricao),
         categoria = VALUES(categoria),
         dados_json = VALUES(dados_json)`,
      [
        modelo.id || `mod_${Date.now()}`,
        modelo.titulo || 'Novo Modelo de Proposta',
        modelo.descricao || '',
        modelo.categoria || 'Geral',
        jsonStr,
        modelo.criadoEm || agora
      ]
    );

    await conn.query(
      `INSERT INTO logs_auditoria (id, usuario_nome, acao, detalhes, data_hora, ip)
       VALUES (?, 'Admin', 'CRIACAO', 'Modelo de proposta salvo no banco de dados.', ?, ?)`,
      [`log_${Date.now()}`, agora, getIp(req)]
    );

    await conn.end();
    return res.json({ success: true, modelo });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/modelos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const conn = await getDbConnection();
    await conn.query('DELETE FROM modelos_propostas WHERE id = ?', [id]);
    await conn.query(
      `INSERT INTO logs_auditoria (id, usuario_nome, acao, detalhes, status_seguranca, data_hora, ip)
       VALUES (?, 'Admin', 'EXCLUSAO', 'Modelo de proposta removido do MySQL.', 'ALERTA', ?, ?)`,
      [`log_${Date.now()}`, new Date().toISOString(), getIp(req)]
    );
    await conn.end();
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Logs de Auditoria
app.get('/api/logs', async (req, res) => {
  try {
    const conn = await getDbConnection();
    const [rows]: any = await conn.query('SELECT * FROM logs_auditoria ORDER BY data_hora DESC LIMIT 200');
    await conn.end();

    const logs = (rows || []).map((r: any) => ({
      id: r.id,
      propostaId: r.proposta_id,
      propostaTitulo: r.proposta_titulo,
      usuarioNome: r.usuario_nome,
      acao: r.acao,
      detalhes: r.detalhes,
      ip: r.ip,
      userAgent: r.user_agent,
      statusSeguranca: r.status_seguranca,
      dataHora: r.data_hora
    }));

    return res.json(logs);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/logs', async (req, res) => {
  try {
    const log = req.body;
    const conn = await getDbConnection();
    await conn.query(
      `INSERT INTO logs_auditoria (id, proposta_id, proposta_titulo, usuario_nome, acao, detalhes, ip, user_agent, status_seguranca, data_hora) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        log.id || `log_${Date.now()}`,
        log.propostaId || '',
        log.propostaTitulo || '',
        log.usuarioNome || 'Sistema',
        log.acao || 'INFO',
        log.detalhes || '',
        getIp(req),
        log.userAgent || req.headers['user-agent'] || '',
        log.statusSeguranca || 'OK',
        log.dataHora || new Date().toISOString()
      ]
    );
    await conn.end();
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Gestão de Usuários da Equipe
app.get('/api/usuarios', async (req, res) => {
  try {
    const conn = await getDbConnection();
    const [rows]: any = await conn.query('SELECT id, nome, email, whatsapp, cargo, foto_url, slug, papel, status, ultimo_login, pode_criar_secoes FROM usuarios');
    await conn.end();

    const usuarios = (rows || []).map((u: any) => ({
      id: u.id,
      nome: u.nome,
      email: u.email,
      whatsapp: u.whatsapp || '',
      cargo: u.cargo || '',
      fotoUrl: u.foto_url || '',
      slug: u.slug || '',
      papel: u.papel,
      status: u.status,
      ultimoLogin: u.ultimo_login,
      podeCriarSecoes: u.pode_criar_secoes === 1,
    }));

    return res.json(usuarios);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/usuarios', async (req, res) => {
  let conn: any;
  try {
    const u = req.body || {};
    const nome = String(u.nome || '').trim();
    const email = String(u.email || '').trim().toLowerCase();
    const papel = u.perfil || u.papel || 'comercial';
    if (!nome || !email) return res.status(400).json({ erro: 'Nome e e-mail são obrigatórios.' });

    conn = await getDbConnection();
    const agora = new Date().toISOString();

    // Verifica se o e-mail já pertence a OUTRO usuário
    const [existentes]: any = await conn.query('SELECT id FROM usuarios WHERE LOWER(email) = ? LIMIT 1', [email]);
    const existente = existentes && existentes[0];
    const [porId]: any = u.id ? await conn.query('SELECT id FROM usuarios WHERE id = ? LIMIT 1', [u.id]) : [[]];
    const isEdicao = !!(porId && porId[0]);
    if (existente && existente.id !== u.id) {
      await conn.end();
      return res.status(409).json({ erro: 'Já existe um usuário cadastrado com este e-mail.' });
    }

    const id = u.id || `usr_${Date.now()}`;
    const campos = [nome, email, u.whatsapp || '', u.cargo || '', u.fotoUrl || '', u.slug || '', papel, u.status || 'ativo', u.podeCriarSecoes ? 1 : 0];

    if (isEdicao) {
      await conn.query(
        `UPDATE usuarios SET nome = ?, email = ?, whatsapp = ?, cargo = ?, foto_url = ?, slug = ?, papel = ?, status = ?, pode_criar_secoes = ? WHERE id = ?`,
        [...campos, id]
      );
      if (u.senha) {
        await conn.query('UPDATE usuarios SET senha = ? WHERE id = ?', [await bcrypt.hash(String(u.senha), 10), id]);
      }
    } else {
      if (!u.senha) {
        await conn.end();
        return res.status(400).json({ erro: 'A senha é obrigatória para novos usuários.' });
      }
      const hash = await bcrypt.hash(String(u.senha), 10);
      await conn.query(
        `INSERT INTO usuarios (id, nome, email, whatsapp, cargo, foto_url, slug, papel, status, pode_criar_secoes, senha, criado_em)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, ...campos, hash, agora]
      );
    }

    await conn.query(
      `INSERT INTO logs_auditoria (id, usuario_nome, acao, detalhes, data_hora, ip)
       VALUES (?, 'Admin', ?, ?, ?, ?)`,
      [`log_${Date.now()}`, isEdicao ? 'EDICAO' : 'CRIACAO', `Usuário "${nome}" ${isEdicao ? 'atualizado' : 'criado'} na equipe.`, agora, getIp(req)]
    );

    const [rows]: any = await conn.query(
      'SELECT id, nome, email, whatsapp, cargo, foto_url, slug, papel, status, ultimo_login, pode_criar_secoes FROM usuarios WHERE id = ?',
      [id]
    );
    await conn.end();
    const r = rows[0];
    return res.status(isEdicao ? 200 : 201).json({
      success: true,
      usuario: {
        id: r.id, nome: r.nome, email: r.email, whatsapp: r.whatsapp || '', cargo: r.cargo || '',
        fotoUrl: r.foto_url || '', slug: r.slug || '', papel: r.papel, perfil: r.papel, status: r.status,
        ultimoLogin: r.ultimo_login, podeCriarSecoes: r.pode_criar_secoes === 1,
      },
    });
  } catch (err: any) {
    try { if (conn) await conn.end(); } catch (e) {}
    console.error('Erro em POST /api/usuarios:', err);
    return res.status(500).json({ erro: 'Erro ao salvar usuário: ' + err.message });
  }
});

app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const conn = await getDbConnection();
    await conn.query('DELETE FROM usuarios WHERE id = ?', [id]);
    await conn.query(
      `INSERT INTO logs_auditoria (id, usuario_nome, acao, detalhes, status_seguranca, data_hora, ip) 
       VALUES (?, 'Admin', 'EXCLUSAO', 'Usuário removido da equipe comercial.', 'ALERTA', ?, ?)`,
      [`log_${Date.now()}`, new Date().toISOString(), getIp(req)]
    );
    await conn.end();
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. MIDDLEWARE DE INSTALAÇÃO & ARQUIVOS ESTÁTICOS
// ==========================================

// ==========================================
// UPLOAD DE IMAGENS (logo, fotos)
// ==========================================
const uploadDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, /^image\/(png|jpe?g|webp|gif|svg\+xml)$/i.test(file.mimetype)),
});

// Só permite upload depois que o sistema estiver instalado
function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!fs.existsSync(LOCK_FILE)) return res.status(403).json({ erro: 'Sistema não instalado.' });
  next();
}

app.post('/api/upload', authMiddleware, upload.single('arquivo'), (req, res) => {
  if (!req.file) return res.status(400).json({ erro: 'Nenhum arquivo enviado (apenas imagens até 5 MB).' });
  res.json({ url: '/uploads/' + req.file.filename });
});

// Arquivos internos do servidor nunca devem ser servidos publicamente
const ARQUIVOS_PROTEGIDOS = /(^|\/)(db-config\.json|installed\.lock|server\.js|\.env.*)$/i;
app.use((req, res, next) => {
  if (ARQUIVOS_PROTEGIDOS.test(req.path)) return res.status(404).end();
  next();
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  // Arquivos estáticos (JS, CSS, imagens) devem carregar mesmo antes da instalação
  if (req.path.startsWith('/assets/') || path.extname(req.path)) return next();

  const isInstalled = fs.existsSync(LOCK_FILE);
  if (!isInstalled && req.path !== '/install') {
    return res.redirect('/install');
  }
  next();
});

// Arquivos públicos enviados (uploads) — servidos ANTES do frontend compilado
app.use(express.static(path.join(process.cwd(), 'public'), { index: false }));

// Servir frontend compilado (index: false para que "/" passe pelo catch-all abaixo)
app.use(express.static(path.join(__dirname), { index: false }));

// Rotas desconhecidas em /api retornam JSON (evita "Unexpected token '<'" no navegador)
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `Rota da API não encontrada: ${req.method} ${req.path}` });
});

// SPA: qualquer outra rota (ex.: /proposta-nome-do-cliente) devolve o index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor de Propostas ativo na porta ${PORT}`));
