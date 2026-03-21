import dotenv from 'dotenv';

// Carrega as variáveis do arquivo .env
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  db: {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE,
  },
  jwtSecret: process.env.JWT_SECRET,
  nomeEmpresa: process.env.NOME_EMPRESA,
  autor: process.env.AUTOR,
  versao: process.env.VERSAO,
  emailHost: process.env.EMAIL_HOST,
  emailPort: process.env.EMAIL_PORT,
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,
};
