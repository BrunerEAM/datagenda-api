
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const knex = require("../db/connection");
const autenticacao = require("../middlewares/autenticacao");


router.put("/", autenticacao, async (req, res) => {
  try {
    const { novaSenha, confirmarSenha } = req.body;
    const userId = req.userId; // Vem do token JWT

    if (!novaSenha || !confirmarSenha) {
      return res.status(400).json({ erro: "Preencha todos os campos." });
    }

    if (novaSenha !== confirmarSenha) {
      return res.status(400).json({ erro: "As senhas não conferem." });
    }

    const hash = await bcrypt.hash(novaSenha, 10);

    await knex("usuarios")
      .where({ id: userId })
      .update({ senha: hash });

    res.json({ mensagem: "Senha alterada com sucesso!" });
  } catch (error) {
    console.error("Erro ao alterar senha:", error);
    res.status(500).json({ erro: "Erro ao alterar senha." });
  }
});

module.exports = router;