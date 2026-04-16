const request = require('supertest');
const app = require('../server');

// Token JWT gerado durante os testes
let token = '';
let personagemCriadoId = '';

// ============================================================
// AUTENTICAÇÃO
// ============================================================
describe('Auth', () => {
  test('POST /api/auth/register — deve criar um usuário', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'testuser_' + Date.now(),
      password: 'senha123',
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('mensagem');
  });

  test('POST /api/auth/login — deve retornar token JWT', async () => {
    // Cria usuário dedicado para login
    const username = 'loginuser_' + Date.now();
    await request(app).post('/api/auth/register').send({ username, password: 'senha123' });

    const res = await request(app).post('/api/auth/login').send({ username, password: 'senha123' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    token = res.body.token; // salva o token para os próximos testes
  });

  test('POST /api/auth/login — deve falhar com credenciais erradas', async () => {
    const res = await request(app).post('/api/auth/login').send({
      username: 'nao_existe',
      password: 'errada',
    });
    expect(res.statusCode).toBe(401);
  });
});

// ============================================================
// PERSONAGENS — leitura pública
// ============================================================
describe('GET /api/characters', () => {
  test('deve listar todos os personagens com paginação', async () => {
    const res = await request(app).get('/api/characters');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('personagens');
    expect(Array.isArray(res.body.personagens)).toBe(true);
  });

  test('deve filtrar por casa', async () => {
    const res = await request(app).get('/api/characters?casa=Stark');
    expect(res.statusCode).toBe(200);
    res.body.personagens.forEach((p) => {
      expect(p.casa.nome).toContain('Stark');
    });
  });

  test('deve filtrar por status', async () => {
    const res = await request(app).get('/api/characters?status=vivo');
    expect(res.statusCode).toBe(200);
    res.body.personagens.forEach((p) => {
      expect(p.status).toBe('vivo');
    });
  });

  test('deve paginar corretamente', async () => {
    const res = await request(app).get('/api/characters?page=1&limit=5');
    expect(res.statusCode).toBe(200);
    expect(res.body.personagens.length).toBeLessThanOrEqual(5);
    expect(res.body).toHaveProperty('totalPaginas');
  });

  test('GET /api/characters/1 — deve retornar Jon Snow', async () => {
    const res = await request(app).get('/api/characters/1');
    expect(res.statusCode).toBe(200);
    expect(res.body.nome).toBe('Jon Snow');
  });

  test('GET /api/characters/9999 — deve retornar 404', async () => {
    const res = await request(app).get('/api/characters/9999');
    expect(res.statusCode).toBe(404);
  });
});

// ============================================================
// PERSONAGENS — escrita (requer token)
// ============================================================
describe('POST /api/characters', () => {
  test('deve criar personagem com token válido', async () => {
    const res = await request(app)
      .post('/api/characters')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nome: 'Personagem Teste',
        casa_id: 1,
        titulo: 'Título Teste',
        status: 'vivo',
        habilidades: ['combate', 'magia'],
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.personagem.nome).toBe('Personagem Teste');
    personagemCriadoId = res.body.personagem.id;
  });

  test('deve rejeitar sem token (401)', async () => {
    const res = await request(app).post('/api/characters').send({
      nome: 'Sem Token',
      titulo: 'Título',
      status: 'vivo',
      habilidades: ['combate'],
    });
    expect(res.statusCode).toBe(401);
  });

  test('deve rejeitar dados inválidos (400)', async () => {
    const res = await request(app)
      .post('/api/characters')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: '', status: 'invalido' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('detalhes');
  });
});

describe('PUT /api/characters/:id', () => {
  test('deve atualizar personagem com token', async () => {
    const res = await request(app)
      .put(`/api/characters/${personagemCriadoId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'morto' });
    expect(res.statusCode).toBe(200);
    expect(res.body.personagem.status).toBe('morto');
  });
});

describe('DELETE /api/characters/:id', () => {
  test('deve deletar personagem com token', async () => {
    const res = await request(app)
      .delete(`/api/characters/${personagemCriadoId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('mensagem');
  });
});

// ============================================================
// CASAS
// ============================================================
describe('GET /api/houses', () => {
  test('deve listar todas as casas com personagens', async () => {
    const res = await request(app).get('/api/houses');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('casas');
    expect(Array.isArray(res.body.casas)).toBe(true);
  });

  test('GET /api/houses/1 — deve retornar a Casa Stark', async () => {
    const res = await request(app).get('/api/houses/1');
    expect(res.statusCode).toBe(200);
    expect(res.body.nome).toBe('Stark');
    expect(Array.isArray(res.body.personagens)).toBe(true);
  });
});
