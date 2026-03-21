const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const knex = require("../db/connection"); // conexão com PostgreSQL

// Rota de login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Verifica se o usuário existe
   // const usuario = await knex("usuarios").where({ email }).first();

// Busca usuário com join para trazer nome da empresa
    const usuario = await knex("usuarios as u")
      .join("empresa as e", "u.empresa_id", "e.id")
      .where("u.email", email)
      .select(
        "u.id",
        "u.nome",
        "u.email",
        "u.senha",
        "u.foto",
        "u.perfil",
        "u.empresa_id",
        "e.nome_empresa as empresa"
      )
      .first();

    if (!usuario) {
      return res.status(401).json({ erro: "Usuário não encontrado." });
    }

    // Compara a senha fornecida com a senha criptografada
    const senhaValida = await bcrypt.compare(password, usuario.senha);

    if (!senhaValida) {
      return res.status(401).json({ erro: "Senha incorreta." });
    }

    // Gera o token JWT
    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, email: usuario.email, empresa_id: usuario.empresa_id },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    // Adicionado os campos 'empresa' e 'perfil' na resposta
    res.status(200).json({ 
      token,
      nome: usuario.nome,
      foto: usuario.foto,
      empresa: usuario.empresa, // <-- Adicionado
      perfil: usuario.perfil // <-- Adicionado
     });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ erro: "Erro ao realizar login." });
  }
});

module.exports = router;