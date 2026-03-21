const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const knex = require("../db/connection");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// 🔑 Função para gerar senha aleatória
function gerarSenha(tamanho = 9) {
  const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&!";
  let senha = "";
  for (let i = 0; i < tamanho; i++) {
    senha += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return senha;
}

// 🔥 Função para criar a pasta da empresa
const criarPastaEmpresa = (empresaId) => {
  const dir = path.join(__dirname, "../uploads", `${empresaId}`);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Pasta criada para empresa: uploads/${empresaId}`);
  }
};

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

// 🔥 Cadastro da empresa
router.post("/", async (req, res) => {
  try {
    const { nome_empresa, nome_responsavel, email, ramo_atividade, whatsapp } = req.body;

    if (!nome_empresa || !nome_responsavel || !email) {
      return res.status(400).json({ erro: "Preencha todos os campos obrigatórios." });
    }

    const emailFormatado = email.toLowerCase();

    const empresaExistente = await knex("empresa")
      .whereRaw("LOWER(email) = ?", emailFormatado)
      .first();

    if (empresaExistente) {
      return res.status(400).json({ erro: "E-mail já cadastrado." });
    }

    const email_existente = await knex("usuarios")
      .whereRaw("LOWER(email) = ?", emailFormatado)
      .first();

    if (email_existente) {
      return res.status(400).json({ erro: "E-mail já em uso!! Por favor, escolha outro e-mail." });
    }

    const hoje = new Date();
    const dataExpira = new Date();
    dataExpira.setDate(hoje.getDate() + 35);

    const [idEmpresa] = await knex("empresa")
      .insert(
        {
          nome_empresa,
          nome_responsavel,
          email: emailFormatado,
          ramo_atividade,
          whatsapp,
          data_cadastro: hoje,
          data_expira: dataExpira,
          status: "ativo",
        },
        ["id"]
      );

    // 🔥 Cria a pasta uploads/{empresaId}
    criarPastaEmpresa(idEmpresa.id);

    // 🔑 Gerar senha aleatória
    const senhaGerada = gerarSenha(9);

    // 🔐 Criptografar senha
    const hash = await bcrypt.hash(senhaGerada, 10);

    const [idUsuario] = await knex("usuarios").insert(
      {
        nome: nome_responsavel,
        email: emailFormatado,
        senha: hash,
        perfil: "admin",
        empresa_id: idEmpresa.id,
      },
      ["id"]
    );

    // 📧 Enviar e-mail com a senha
    await transporter.sendMail({
      from: `"Datagenda" <${process.env.EMAIL_USER}>`,
      to: emailFormatado,
      subject: "🎉 Bem-vindo ao Datagenda!",
      html: `
        <h3>Olá ${nome_responsavel},</h3>
        <p>Sua empresa <strong>${nome_empresa}</strong> foi cadastrada com sucesso no Datagenda 🚀.</p>
        <p>Use os dados abaixo para acessar o sistema:</p>
        <ul>
          <li><strong>Login:</strong> ${emailFormatado}</li>
          <li><strong>Senha:</strong> ${senhaGerada}</li>
        </ul>
        <p>💡 Recomendamos que você altere sua senha após o primeiro acesso.</p>
        <p><a href="http://192.168.0.6:3000" target="_blank">👉 Acessar o sistema</a></p>
        <br />
        <p>Atenciosamente,<br />Equipe Datagenda</p>
      `,
    });

    // 🔐 Gerar token
  const token = jwt.sign(
  {
    id: idUsuario.id,
    empresa_id: idEmpresa.id, // <- esse nome bate com o middleware
  },
  process.env.JWT_SECRET,
  { expiresIn: "30d" }
);


    res.json({
      mensagem: "Empresa cadastrada com sucesso! Verifique seu e-mail para acessar.",
      token,
      empresaId: idEmpresa.id,
      userId: idUsuario.id,
    });
  } catch (error) {
    console.error("Erro ao cadastrar empresa:", error);
    res.status(500).json({ erro: "Erro ao cadastrar empresa." });
  }
});

module.exports = router;
