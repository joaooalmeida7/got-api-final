const express = require('express');
const app = express();

// Middleware para parsear JSON
app.use(express.json());

// Importa as rotas
const authRouter       = require('./routes/auth');
const charactersRouter = require('./routes/characters');
const housesRouter     = require('./routes/houses');

// Registra as rotas
app.use('/api/auth',       authRouter);
app.use('/api/characters', charactersRouter);
app.use('/api/houses',     housesRouter);

// Rota raiz — informações gerais da API
app.get('/', (req, res) => {
  res.json({
    message: 'API de Game of Thrones 🐉 v2.0',
    descricao: 'API REST completa com SQLite, JWT e relacionamentos',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login:    'POST /api/auth/login',
      },
      personagens: {
        listar:   'GET  /api/characters',
        filtros:  'GET  /api/characters?casa=Stark&status=vivo&nome=jon',
        paginar:  'GET  /api/characters?page=1&limit=5&orderBy=c.nome&order=asc',
        buscar:   'GET  /api/characters/:id',
        criar:    'POST /api/characters       [requer token]',
        atualizar:'PUT  /api/characters/:id   [requer token]',
        deletar:  'DELETE /api/characters/:id [requer token]',
      },
      casas: {
        listar:   'GET  /api/houses',
        buscar:   'GET  /api/houses/:id',
        criar:    'POST /api/houses            [requer token]',
        atualizar:'PUT  /api/houses/:id        [requer token]',
        deletar:  'DELETE /api/houses/:id      [requer token]',
      },
    },
  });
});

// Tratamento de rotas não encontradas (404)
app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada.' });
});

// Tratamento global de erros (500)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ erro: 'Erro interno no servidor.' });
});

const PORT = process.env.PORT || 3000;

// Exporta o app para os testes (sem iniciar o servidor)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🐉 Servidor rodando em http://localhost:${PORT}`);
  });
}

module.exports = app;
