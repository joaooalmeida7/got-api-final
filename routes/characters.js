const express = require('express');
const router = express.Router();
const db = require('../database');
const { autenticar } = require('../middleware/auth');

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

// Converte string de habilidades "a,b,c" em array ["a","b","c"]
function parseHabilidades(str) {
  return str ? str.split(',').map((h) => h.trim()) : [];
}

// Formata personagem do banco para a resposta JSON
function formatChar(c) {
  return {
    id: c.id,
    nome: c.nome,
    casa: c.casa_nome ? { id: c.casa_id, nome: c.casa_nome, regiao: c.regiao } : null,
    titulo: c.titulo,
    status: c.status,
    habilidades: parseHabilidades(c.habilidades),
  };
}

// Valida campos de um personagem
function validar(dados, obrigatorio = true) {
  const erros = [];
  const statusOk = ['vivo', 'morto', 'desaparecido'];

  if (obrigatorio || dados.nome !== undefined) {
    if (!dados.nome || dados.nome.trim().length < 2)
      erros.push('nome: obrigatório, mínimo 2 caracteres.');
  }
  if (obrigatorio || dados.titulo !== undefined) {
    if (!dados.titulo || dados.titulo.trim().length < 2)
      erros.push('titulo: obrigatório, mínimo 2 caracteres.');
  }
  if (obrigatorio || dados.status !== undefined) {
    if (!dados.status || !statusOk.includes(dados.status))
      erros.push(`status: obrigatório. Valores aceitos: ${statusOk.join(', ')}.`);
  }
  if (obrigatorio || dados.habilidades !== undefined) {
    if (!Array.isArray(dados.habilidades) || dados.habilidades.length === 0)
      erros.push('habilidades: obrigatório, deve ser um array com ao menos 1 item.');
  }
  return erros;
}

// Query base com JOIN para trazer o nome da casa junto
const BASE_QUERY = `
  SELECT c.*, h.nome as casa_nome, h.regiao
  FROM characters c
  LEFT JOIN houses h ON c.casa_id = h.id
`;

// ============================================================
// GET /api/characters
// Filtros:   ?casa=Stark  ?status=vivo  ?nome=jon
// Ordenação: ?orderBy=nome  ?order=asc|desc
// Paginação: ?page=1  ?limit=10
// ============================================================
router.get('/', (req, res) => {
  const { casa, status, nome, orderBy = 'c.id', order = 'asc', page = 1, limit = 10 } = req.query;

  // Validação de ordenação para evitar SQL injection
  const colunasPermitidas = ['c.id', 'c.nome', 'c.status', 'c.titulo'];
  const colunaOrdem = colunasPermitidas.includes(orderBy) ? orderBy : 'c.id';
  const direcao = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  // Monta os filtros dinamicamente
  const condicoes = [];
  const params = [];

  if (casa) {
    condicoes.push('h.nome LIKE ?');
    params.push(`%${casa}%`);
  }
  if (status) {
    condicoes.push('c.status = ?');
    params.push(status);
  }
  if (nome) {
    condicoes.push('c.nome LIKE ?');
    params.push(`%${nome}%`);
  }

  const where = condicoes.length > 0 ? `WHERE ${condicoes.join(' AND ')}` : '';

  // Conta o total para paginação
  const totalQuery = `SELECT COUNT(*) as total FROM characters c LEFT JOIN houses h ON c.casa_id = h.id ${where}`;
  const { total } = db.prepare(totalQuery).get(...params);

  // Paginação
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const rows = db
    .prepare(`${BASE_QUERY} ${where} ORDER BY ${colunaOrdem} ${direcao} LIMIT ? OFFSET ?`)
    .all(...params, limitNum, offset);

  res.status(200).json({
    total,
    pagina: pageNum,
    limite: limitNum,
    totalPaginas: Math.ceil(total / limitNum),
    personagens: rows.map(formatChar),
  });
});

// ============================================================
// GET /api/characters/:id — Busca por ID com JOIN
// ============================================================
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ erro: 'ID inválido.' });

  const row = db.prepare(`${BASE_QUERY} WHERE c.id = ?`).get(id);
  if (!row) return res.status(404).json({ erro: `Personagem com ID ${id} não encontrado.` });

  res.status(200).json(formatChar(row));
});

// ============================================================
// POST /api/characters — Cria personagem (requer autenticação)
// ============================================================
router.post('/', autenticar, (req, res) => {
  const erros = validar(req.body, true);
  if (erros.length > 0) return res.status(400).json({ erro: 'Dados inválidos.', detalhes: erros });

  const { nome, casa_id, titulo, status, habilidades } = req.body;

  // Verifica se a casa existe (se foi informada)
  if (casa_id) {
    const casa = db.prepare('SELECT id FROM houses WHERE id = ?').get(casa_id);
    if (!casa) return res.status(400).json({ erro: `Casa com ID ${casa_id} não encontrada.` });
  }

  const result = db
    .prepare('INSERT INTO characters (nome, casa_id, titulo, status, habilidades) VALUES (?, ?, ?, ?, ?)')
    .run(nome.trim(), casa_id || null, titulo.trim(), status, habilidades.join(','));

  const novo = db.prepare(`${BASE_QUERY} WHERE c.id = ?`).get(result.lastInsertRowid);
  res.status(201).json({ mensagem: 'Personagem criado com sucesso!', personagem: formatChar(novo) });
});

// ============================================================
// PUT /api/characters/:id — Atualiza personagem (requer autenticação)
// ============================================================
router.put('/:id', autenticar, (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ erro: 'ID inválido.' });

  const atual = db.prepare('SELECT * FROM characters WHERE id = ?').get(id);
  if (!atual) return res.status(404).json({ erro: `Personagem com ID ${id} não encontrado.` });

  const erros = validar(req.body, false);
  if (erros.length > 0) return res.status(400).json({ erro: 'Dados inválidos.', detalhes: erros });

  const { nome, casa_id, titulo, status, habilidades } = req.body;

  if (casa_id) {
    const casa = db.prepare('SELECT id FROM houses WHERE id = ?').get(casa_id);
    if (!casa) return res.status(400).json({ erro: `Casa com ID ${casa_id} não encontrada.` });
  }

  const atualizado = {
    nome:        nome       ? nome.trim()              : atual.nome,
    casa_id:     casa_id    !== undefined ? casa_id    : atual.casa_id,
    titulo:      titulo     ? titulo.trim()            : atual.titulo,
    status:      status     || atual.status,
    habilidades: habilidades ? habilidades.join(',')   : atual.habilidades,
  };

  db.prepare('UPDATE characters SET nome=?, casa_id=?, titulo=?, status=?, habilidades=? WHERE id=?')
    .run(atualizado.nome, atualizado.casa_id, atualizado.titulo, atualizado.status, atualizado.habilidades, id);

  const resultado = db.prepare(`${BASE_QUERY} WHERE c.id = ?`).get(id);
  res.status(200).json({ mensagem: 'Personagem atualizado com sucesso!', personagem: formatChar(resultado) });
});

// ============================================================
// DELETE /api/characters/:id — Remove personagem (requer autenticação)
// ============================================================
router.delete('/:id', autenticar, (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ erro: 'ID inválido.' });

  const personagem = db.prepare('SELECT * FROM characters WHERE id = ?').get(id);
  if (!personagem) return res.status(404).json({ erro: `Personagem com ID ${id} não encontrado.` });

  db.prepare('DELETE FROM characters WHERE id = ?').run(id);
  res.status(200).json({
    mensagem: `Personagem "${personagem.nome}" removido com sucesso.`,
    personagem: { ...personagem, habilidades: parseHabilidades(personagem.habilidades) },
  });
});

module.exports = router;
