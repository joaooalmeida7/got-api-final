const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'got_secret_key_2024';

/**
 * Middleware que verifica se o token JWT é válido.
 * Uso: adicionar como parâmetro em qualquer rota protegida.
 * Exemplo: router.post('/', autenticar, (req, res) => { ... })
 */
function autenticar(req, res, next) {
  // O token deve vir no header: Authorization: Bearer <token>
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ erro: 'Token não fornecido. Faça login primeiro.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.usuario = payload; // disponibiliza os dados do usuário na rota
    next();
  } catch (err) {
    return res.status(403).json({ erro: 'Token inválido ou expirado.' });
  }
}

module.exports = { autenticar, JWT_SECRET };
