const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const knex = require("../db/connection");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");


// 🔑 Função para gerar senha aleatória
function gerarSenha(tamanho = 9) {
  const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&!";
  let senha = "";
  for (let i = 0; i < tamanho; i++) {
    senha += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return senha;
}

// 🚀 Configuração do Nodemailer
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


// backend/routes/recuperarSenha.js
router.post("/esqueci-senha", async (req, res) => {
  const { email } = req.body;

  try {
    const usuario = await knex("usuarios").whereRaw("LOWER(email) = ?", email.toLowerCase()).first();

    if (!usuario) {
      return res.status(404).json({ erro: "E-mail não encontrado." });
    }

    // Gera nova senha
    const novaSenha = gerarSenha(9);
    const hash = await bcrypt.hash(novaSenha, 10);

    // Atualiza no banco
    await knex("usuarios")
      .where("id", usuario.id)
      .update({ senha: hash });

    // Busca dados da empresa do usuário
    const empresa = await knex("empresa").where("id", usuario.empresa_id).first();

    // Envia o e-mail
    await transporter.sendMail({
      from: `"Datagenda" <${process.env.EMAIL_USER}>`,
      to: usuario.email,
      subject: "🔑 Recuperação de senha - Datagenda",
      html: `
        <h3>Olá ${usuario.nome},</h3>
        <p>Segue sua nova senha de acesso ao Datagenda:</p>
        <ul>
          <li><strong>Login:</strong> ${usuario.email}</li>
          <li><strong>Nova senha:</strong> ${novaSenha}</li>
        </ul>
        <p>💡 Recomendamos que altere sua senha após o login.</p>
        <p><a href="http://192.168.0.6:3000" target="_blank">👉 Acessar o sistema</a></p>
      `,
    });

    res.json({ mensagem: "Nova senha enviada para seu e-mail." });

  } catch (error) {
    console.error("Erro ao recuperar senha:", error);
    res.status(500).json({ erro: "Erro ao recuperar senha." });
  }
});

module.exports = router;