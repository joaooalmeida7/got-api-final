const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { JWT_SECRET } = require('../middleware/auth');

// ============================================================
// POST /api/auth/register — Cria um novo usuário
// ============================================================
router.post('/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ erro: 'username e password são obrigatórios.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ erro: 'password deve ter no mínimo 6 caracteres.' });
  }

  // Verifica se o usuário já existe
  const existe = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existe) {
    return res.status(409).json({ erro: 'Username já está em uso.' });
  }

  // Hash da senha antes de salvar
  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, hash);

  res.status(201).json({
    mensagem: 'Usuário criado com sucesso!',
    usuario: { id: result.lastInsertRowid, username },
  });
});

// ============================================================
// POST /api/auth/login — Retorna o token JWT
// ============================================================
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ erro: 'username e password são obrigatórios.' });
  }

  const usuario = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!usuario || !bcrypt.compareSync(password, usuario.password)) {
    return res.status(401).json({ erro: 'Credenciais inválidas.' });
  }

  // Gera o token JWT com validade de 24h
  const token = jwt.sign(
    { id: usuario.id, username: usuario.username },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.status(200).json({
    mensagem: 'Login realizado com sucesso!',
    token,
    expira_em: '24h',
  });
});

module.exports = router;
