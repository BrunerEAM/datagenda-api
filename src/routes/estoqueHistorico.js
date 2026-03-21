// ✅ estoqueHistorico.js - Revisado para histórico de movimentações por produto

const express = require("express");
const router = express.Router();
const knex = require("../db/connection");
const autenticacao = require("../middleware/autenticacao");

// GET /api/estoque/historico/:produtoId
router.get("/historico/:produtoId", autenticacao, async (req, res) => {
  try {
    const { produtoId } = req.params;

    const historico = await knex("estoque_movimentacoes as em")
      .leftJoin("usuarios", "usuarios.id", "em.usuario_id")
      .select(
        "em.id",
        "em.tipo",
        "em.quantidade",
        "em.estoque_antes",
        "em.estoque_depois",
        "em.data_movimentacao",
        "em.observacao",
        "usuarios.nome as usuario_nome"
      )
      .where("em.produto_id", produtoId)
      .andWhere("em.empresa_id", req.empresaId)
      .orderBy("em.data_movimentacao", "desc");

    res.json(historico);
  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    res.status(500).json({ erro: "Erro ao buscar histórico." });
  }
});

module.exports = router;
