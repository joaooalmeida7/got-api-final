const express = require('express');
const router = express.Router();
const db = require('../database');
const { autenticar } = require('../middleware/auth');

// ============================================================
// GET /api/houses — Lista todas as casas com seus personagens
// ============================================================
router.get('/', (req, res) => {
  const houses = db.prepare('SELECT * FROM houses ORDER BY nome').all();

  // Para cada casa, busca os personagens relacionados (JOIN)
  const resultado = houses.map((house) => {
    const personagens = db
      .prepare('SELECT id, nome, titulo, status FROM characters WHERE casa_id = ?')
      .all(house.id);
    return { ...house, personagens };
  });

  res.status(200).json({ total: resultado.length, casas: resultado });
});

// ============================================================
// GET /api/houses/:id — Busca uma casa pelo ID com seus personagens
// ============================================================
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ erro: 'ID inválido.' });

  const house = db.prepare('SELECT * FROM houses WHERE id = ?').get(id);
  if (!house) return res.status(404).json({ erro: `Casa com ID ${id} não encontrada.` });

  // JOIN: busca os personagens dessa casa
  const personagens = db
    .prepare('SELECT id, nome, titulo, status FROM characters WHERE casa_id = ?')
    .all(id);

  res.status(200).json({ ...house, personagens });
});

// ============================================================
// POST /api/houses — Cria uma nova casa (requer autenticação)
// ============================================================
router.post('/', autenticar, (req, res) => {
  const { nome, regiao, lema, sede } = req.body;

  if (!nome || !regiao) {
    return res.status(400).json({ erro: 'nome e regiao são obrigatórios.' });
  }

  try {
    const result = db
      .prepare('INSERT INTO houses (nome, regiao, lema, sede) VALUES (?, ?, ?, ?)')
      .run(nome, regiao, lema || null, sede || null);

    const nova = db.prepare('SELECT * FROM houses WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ mensagem: 'Casa criada com sucesso!', casa: nova });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ erro: `Casa "${nome}" já existe.` });
    }
    throw err;
  }
});

// ============================================================
// PUT /api/houses/:id — Atualiza uma casa (requer autenticação)
// ============================================================
router.put('/:id', autenticar, (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ erro: 'ID inválido.' });

  const house = db.prepare('SELECT * FROM houses WHERE id = ?').get(id);
  if (!house) return res.status(404).json({ erro: `Casa com ID ${id} não encontrada.` });

  const { nome, regiao, lema, sede } = req.body;

  const atualizado = {
    nome:   nome   || house.nome,
    regiao: regiao || house.regiao,
    lema:   lema   !== undefined ? lema : house.lema,
    sede:   sede   !== undefined ? sede : house.sede,
  };

  db.prepare('UPDATE houses SET nome=?, regiao=?, lema=?, sede=? WHERE id=?')
    .run(atualizado.nome, atualizado.regiao, atualizado.lema, atualizado.sede, id);

  const resultado = db.prepare('SELECT * FROM houses WHERE id = ?').get(id);
  res.status(200).json({ mensagem: 'Casa atualizada com sucesso!', casa: resultado });
});

// ============================================================
// DELETE /api/houses/:id — Remove uma casa (requer autenticação)
// ============================================================
router.delete('/:id', autenticar, (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ erro: 'ID inválido.' });

  const house = db.prepare('SELECT * FROM houses WHERE id = ?').get(id);
  if (!house) return res.status(404).json({ erro: `Casa com ID ${id} não encontrada.` });

  db.prepare('DELETE FROM houses WHERE id = ?').run(id);
  res.status(200).json({ mensagem: `Casa "${house.nome}" removida com sucesso.`, casa: house });
});

module.exports = router;
