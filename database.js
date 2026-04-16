const Database = require('better-sqlite3');
const path = require('path');

// Cria (ou abre) o banco de dados SQLite no arquivo got.db
const db = new Database(path.join(__dirname, 'got.db'));

// Habilita foreign keys no SQLite
db.pragma('foreign_keys = ON');

// ============================================================
// CRIAÇÃO DAS TABELAS
// ============================================================
db.exec(`
  -- Tabela de casas (relacionamento com personagens)
  CREATE TABLE IF NOT EXISTS houses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL UNIQUE,
    regiao TEXT NOT NULL,
    lema TEXT,
    sede TEXT
  );

  -- Tabela de usuários (para autenticação JWT)
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  );

  -- Tabela de personagens (referencia houses)
  CREATE TABLE IF NOT EXISTS characters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    casa_id INTEGER,
    titulo TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('vivo', 'morto', 'desaparecido')),
    habilidades TEXT NOT NULL,
    FOREIGN KEY (casa_id) REFERENCES houses(id)
  );
`);

// ============================================================
// SEED — insere dados iniciais apenas se as tabelas estiverem vazias
// ============================================================

const totalHouses = db.prepare('SELECT COUNT(*) as count FROM houses').get().count;

if (totalHouses === 0) {
  // -- Casas --
  const insertHouse = db.prepare(`
    INSERT INTO houses (nome, regiao, lema, sede)
    VALUES (@nome, @regiao, @lema, @sede)
  `);

  const houses = [
    { nome: 'Stark',      regiao: 'Norte',          lema: 'O Inverno Está Chegando', sede: 'Winterfell' },
    { nome: 'Lannister',  regiao: 'Terras Ocidentais', lema: 'Ouça-me Rugir',        sede: 'Rochedo Casterly' },
    { nome: 'Targaryen',  regiao: 'Pedra do Dragão', lema: 'Fogo e Sangue',           sede: 'Dragonstone' },
    { nome: 'Baratheon',  regiao: 'Terras da Tormenta', lema: 'A Nossa É a Fúria',   sede: 'Tempestade' },
    { nome: 'Greyjoy',    regiao: 'Ilhas de Ferro',  lema: 'Nós Não Semeamos',        sede: 'Pyke' },
    { nome: 'Tyrell',     regiao: 'O Reach',         lema: 'Crescendo Forte',         sede: 'Highgarden' },
    { nome: 'Martell',    regiao: 'Dorne',           lema: 'Não Dobrado, Não Curvado, Não Quebrado', sede: 'Sunspear' },
    { nome: 'Tully',      regiao: 'Terras dos Rios', lema: 'Família, Dever, Honra',   sede: 'Aguasdobce' },
    { nome: 'Arryn',      regiao: 'Vale de Arryn',   lema: 'Tão Alto Quanto a Honra', sede: 'Ninho da Águia' },
    { nome: 'Tarly',      regiao: 'O Reach',         lema: 'Primeiro no Campo',       sede: 'Chifre da Colina' },
  ];

  const insertManyHouses = db.transaction((list) => {
    for (const h of list) insertHouse.run(h);
  });
  insertManyHouses(houses);

  // -- Personagens (22 registros) --
  const insertChar = db.prepare(`
    INSERT INTO characters (nome, casa_id, titulo, status, habilidades)
    VALUES (@nome, @casa_id, @titulo, @status, @habilidades)
  `);

  const characters = [
    { nome: 'Jon Snow',           casa_id: 1,  titulo: 'Rei do Norte',              status: 'vivo',        habilidades: 'combate,liderança,ressurreição' },
    { nome: 'Arya Stark',         casa_id: 1,  titulo: 'Sem Rosto',                 status: 'vivo',        habilidades: 'assassinato,stealth,esgrima' },
    { nome: 'Sansa Stark',        casa_id: 1,  titulo: 'Senhora de Winterfell',     status: 'vivo',        habilidades: 'política,diplomacia,liderança' },
    { nome: 'Bran Stark',         casa_id: 1,  titulo: 'Rei dos Seis Reinos',       status: 'vivo',        habilidades: 'greensight,warg,profecia' },
    { nome: 'Ned Stark',          casa_id: 1,  titulo: 'Lorde de Winterfell',       status: 'morto',       habilidades: 'combate,liderança,honra' },
    { nome: 'Robb Stark',         casa_id: 1,  titulo: 'Rei do Norte',              status: 'morto',       habilidades: 'combate,estratégia,liderança' },
    { nome: 'Tyrion Lannister',   casa_id: 2,  titulo: 'Mão do Rei',               status: 'vivo',        habilidades: 'inteligência,diplomacia,política' },
    { nome: 'Cersei Lannister',   casa_id: 2,  titulo: 'Rainha dos Sete Reinos',    status: 'morto',       habilidades: 'política,manipulação,estratégia' },
    { nome: 'Jaime Lannister',    casa_id: 2,  titulo: 'Matador de Reis',           status: 'morto',       habilidades: 'combate,esgrima,cavalaria' },
    { nome: 'Joffrey Baratheon',  casa_id: 4,  titulo: 'Rei dos Sete Reinos',       status: 'morto',       habilidades: 'crueldade,política' },
    { nome: 'Daenerys Targaryen', casa_id: 3,  titulo: 'Mãe dos Dragões',           status: 'morto',       habilidades: 'dragões,liderança,estratégia' },
    { nome: 'Viserys Targaryen',  casa_id: 3,  titulo: 'Rei Mendigo',               status: 'morto',       habilidades: 'arrogância,política' },
    { nome: 'Theon Greyjoy',      casa_id: 5,  titulo: 'Príncipe de Pyke',          status: 'morto',       habilidades: 'combate,navegação,redenção' },
    { nome: 'Yara Greyjoy',       casa_id: 5,  titulo: 'Rainha das Ilhas de Ferro', status: 'vivo',        habilidades: 'combate,navegação,liderança' },
    { nome: 'Margaery Tyrell',    casa_id: 6,  titulo: 'Rainha dos Sete Reinos',    status: 'morto',       habilidades: 'política,manipulação,charme' },
    { nome: 'Olenna Tyrell',      casa_id: 6,  titulo: 'Rainha dos Espinhos',       status: 'morto',       habilidades: 'política,manipulação,veneno' },
    { nome: 'Oberyn Martell',     casa_id: 7,  titulo: 'Príncipe de Dorne',         status: 'morto',       habilidades: 'combate,veneno,esgrima' },
    { nome: 'Samwell Tarly',      casa_id: 10, titulo: 'Maester',                   status: 'vivo',        habilidades: 'medicina,conhecimento,magia' },
    { nome: 'Melisandre',         casa_id: null, titulo: 'A Mulher Vermelha',       status: 'morto',       habilidades: 'magia,profecia,necromancia' },
    { nome: 'Davos Seaworth',     casa_id: 4,  titulo: 'Cavaleiro da Cebola',       status: 'vivo',        habilidades: 'navegação,diplomacia,lealdade' },
    { nome: 'Brienne de Tarth',   casa_id: null, titulo: 'Cavaleira dos Sete Reinos', status: 'vivo',     habilidades: 'combate,honra,lealdade' },
    { nome: 'Sandor Clegane',     casa_id: null, titulo: 'O Cão',                   status: 'vivo',        habilidades: 'combate,força,brutalidade' },
  ];

  const insertManyChars = db.transaction((list) => {
    for (const c of list) insertChar.run(c);
  });
  insertManyChars(characters);

  console.log('✅ Banco de dados populado com sucesso!');
}

module.exports = db;
