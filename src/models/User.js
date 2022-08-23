import bcrypt from 'bcryptjs';

import Database from '../database/database.js';

const salt = Number(process.env.SALT);

async function create(user) {
  const db = await Database.connect();

  const { nome, email, senha } = user;

  const hash = bcrypt.hashSync(senha, salt);
  console.log(user)
  const sql = `
    INSERT INTO
      empresarios (email, nome, senha)
    VALUES
      (?, ?, ?)
  `;
  
  const { lastID } = await db.run(sql, [email, nome, hash]);
  
  return read(lastID);
}

async function read(id) {
  const db = await Database.connect();

  const sql = `
    SELECT 
      *
    FROM 
      users
    WHERE
      id = ?
  `;

  const user = await db.get(sql, [id]);

  return user;
}

async function readByEmail(email) {
  const db = await Database.connect();

  const sql = `
    SELECT
      *
    FROM
      empresarios
    WHERE
      email = ?
  `;

  const user = await db.get(sql, [email]);

  return user;
}

export default { create, read, readByEmail };
