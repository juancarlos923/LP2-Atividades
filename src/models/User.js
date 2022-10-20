import bcrypt from 'bcryptjs';

import Database from '../database/database.js';
import SendMail from '../services/SendMail.js';

const salt = Number(process.env.SALT);

function gerarVerifyEmail() {
  return Math.random().toString(36).slice(-10);
}

async function create(user,imagem) {
  const db = await Database.connect();
  const { nome, email, senha } = user;

  const hash = bcrypt.hashSync(senha, salt);
  const token_verify_email = gerarVerifyEmail()
  const sql = `
    INSERT INTO
      empresarios (email, nome, senha, imagem, token_verify_email, verificado)
    VALUES
      (?, ?, ?, ?, ?, ?)
  `;
  
  const { lastID } = await db.run(sql, [email, nome, hash, imagem, token_verify_email, "Não"]);
  return token_verify_email;
}

async function read(id) {
  const db = await Database.connect();

  const sql = `
    SELECT 
      *
    FROM 
      empresarios
    WHERE
      id_empresario = ?
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

async function readByToken(token) {
  const db = await Database.connect();

  const sql = `
    SELECT
      *
    FROM
      empresarios
    WHERE
      token_verify_email = ?
  `;

  const user = await db.get(sql, [token]);

  return user;
}

async function token_verificado_email(token,email) {
  const db = await Database.connect();
  
  const sql = `
    UPDATE
      empresarios
    SET
      verificado = "Sim"
    WHERE
      token_verify_email = ?
  `;

  const dados = await db.run(sql, [token]);
  if(dados.changes > 0){
    const { email } = await readByToken(token);
    await confirmVerifyEmail(email);
      return true;
  } else {
      return false;
  }
}

async function createNewUser(to, token) {
  const subject = 'Conta criada com Sucesso! By Multilojas App'
  const text = `Verificação de Email Necessária!\n\nAcesse o link abaixo.\n\nhttp://localhost:3000/token/${token}`
  const html = `<h1>Verificação de Email Necessária!</h1><a href="http://localhost:3000/token/${token}">Aperte aqui para Verificar.</a>`

  SendMail.sendMail(to, subject, text, html);
}

async function confirmVerifyEmail(to) {
  console.log("confirmEmail")
  const subject = 'Email verificado com sucesso! By Multilojas App'
  const text = `Acesse nosso site: http://localhost:3000 e faça aproveite.`
  const html = `<h1>Seu Email foi Verificado com Sucesso!</h1><a href="http://localhost:3000">Aperte aqui para Acessar nosso Site.</a></h1>`

  SendMail.sendMail(to, subject, text, html);
}

export default { create, read, readByEmail, token_verificado_email, createNewUser, confirmVerifyEmail };
