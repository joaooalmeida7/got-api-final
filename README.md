# 🐉 API de Game of Thrones — v2.0

API REST completa para gerenciamento de personagens e casas de Game of Thrones.  
Construída com **Node.js**, **Express**, **SQLite** e autenticação **JWT**.

---

## Tecnologias utilizadas

- **Node.js** + **Express** — servidor e rotas
- **better-sqlite3** — banco de dados SQLite
- **jsonwebtoken** — autenticação JWT
- **bcryptjs** — hash de senhas
- **Jest** + **Supertest** — testes automatizados

---

## Como instalar e rodar

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar o servidor
node server.js

# Servidor disponível em: http://localhost:3000

# 3. Rodar os testes automatizados
npm test
```

> O banco de dados SQLite (`got.db`) é criado automaticamente com 22 personagens e 10 casas na primeira execução.

---

## Estrutura do projeto

```
got-api/
├── server.js               # Ponto de entrada
├── database.js             # SQLite — tabelas e seed
├── middleware/
│   └── auth.js             # Middleware JWT
├── routes/
│   ├── auth.js             # Register e Login
│   ├── characters.js       # CRUD de personagens
│   └── houses.js           # CRUD de casas
├── tests/
│   └── characters.test.js  # Testes automatizados
├── .gitignore
├── package.json
└── README.md
```

---

## Modelo de dados

### Personagem

| Campo        | Tipo     | Regras                                          |
|--------------|----------|-------------------------------------------------|
| `id`         | number   | Automático                                      |
| `nome`       | string   | Obrigatório, mínimo 2 caracteres                |
| `casa`       | objeto   | Referência a `houses` via JOIN                  |
| `titulo`     | string   | Obrigatório, mínimo 2 caracteres                |
| `status`     | string   | `vivo`, `morto` ou `desaparecido`               |
| `habilidades`| string[] | Array com ao menos 1 item                       |

### Casa

| Campo    | Tipo   | Regras              |
|----------|--------|---------------------|
| `id`     | number | Automático          |
| `nome`   | string | Obrigatório, único  |
| `regiao` | string | Obrigatório         |
| `lema`   | string | Opcional            |
| `sede`   | string | Opcional            |

---

## Autenticação JWT

Rotas de escrita (POST, PUT, DELETE) exigem token JWT.

### Registrar usuário
```
POST /api/auth/register
Body: { "username": "joao", "password": "senha123" }
```

### Fazer login e obter token
```
POST /api/auth/login
Body: { "username": "joao", "password": "senha123" }
Resposta: { "token": "eyJ..." }
```

### Usar o token
Em toda requisição protegida, adicione o header:
```
Authorization: Bearer eyJ...
```

---

## Endpoints — Personagens

### GET `/api/characters`
Lista todos os personagens. Suporta filtros, ordenação e paginação.

| Query param | Exemplo                  | Descrição              |
|-------------|--------------------------|------------------------|
| `casa`      | `?casa=Stark`            | Filtra por casa        |
| `status`    | `?status=vivo`           | Filtra por status      |
| `nome`      | `?nome=jon`              | Busca por nome         |
| `orderBy`   | `?orderBy=c.nome`        | Campo de ordenação     |
| `order`     | `?order=desc`            | `asc` ou `desc`        |
| `page`      | `?page=2`                | Página atual           |
| `limit`     | `?limit=5`               | Itens por página       |

**Resposta 200:**
```json
{
  "total": 22,
  "pagina": 1,
  "limite": 10,
  "totalPaginas": 3,
  "personagens": [...]
}
```

### GET `/api/characters/:id`
Busca personagem por ID com dados da casa via JOIN.

### POST `/api/characters` 🔒
Cria novo personagem. **Requer token.**

```json
{
  "nome": "Theon Greyjoy",
  "casa_id": 5,
  "titulo": "Príncipe de Pyke",
  "status": "morto",
  "habilidades": ["combate", "navegação"]
}
```

### PUT `/api/characters/:id` 🔒
Atualiza parcialmente. **Requer token.**

### DELETE `/api/characters/:id` 🔒
Remove personagem. **Requer token.**

---

## Endpoints — Casas

### GET `/api/houses`
Lista todas as casas com seus personagens (JOIN).

### GET `/api/houses/:id`
Busca casa por ID com lista de personagens.

### POST `/api/houses` 🔒
Cria nova casa. **Requer token.**

```json
{
  "nome": "Bolton",
  "regiao": "Norte",
  "lema": "Nosso Amanhecer Chega",
  "sede": "Porto Cervo"
}
```

### PUT `/api/houses/:id` 🔒
Atualiza casa. **Requer token.**

### DELETE `/api/houses/:id` 🔒
Remove casa. **Requer token.**

---

## Status codes

| Código | Significado                     |
|--------|---------------------------------|
| 200    | Sucesso                         |
| 201    | Criado com sucesso              |
| 400    | Dados inválidos                 |
| 401    | Não autenticado (sem token)     |
| 403    | Token inválido ou expirado      |
| 404    | Recurso não encontrado          |
| 409    | Conflito (registro duplicado)   |
| 500    | Erro interno do servidor        |

---

## Testes automatizados

```bash
npm test
```

Cobertura dos testes:
- Registro e login de usuários
- Listagem com filtros e paginação
- Busca por ID (encontrado e 404)
- Criação com e sem token
- Validação de dados inválidos
- Atualização parcial
- Remoção
- Listagem de casas com JOIN

---

## Deploy

A API está publicada em: **[link do Render aqui]**

Para fazer deploy no Render:
1. Crie uma conta em [render.com](https://render.com)
2. Clique em **New > Web Service**
3. Conecte seu repositório GitHub
4. Configure: `Build Command: npm install` | `Start Command: node server.js`
5. Clique em **Deploy**

---

## Commits organizados

```
feat: setup inicial Express + estrutura de pastas
feat: integração SQLite com better-sqlite3
feat: seed com 22 personagens e 10 casas
feat: autenticação JWT (register e login)
feat: CRUD de personagens com filtros e paginação
feat: CRUD de casas com relacionamento JOIN
feat: testes automatizados com Jest e Supertest
docs: README completo com todos os endpoints
chore: adiciona .gitignore
```
