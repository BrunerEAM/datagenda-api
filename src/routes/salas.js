const express = require("express");
const router = express.Router();
const knex = require("../db/connection");
const autenticacao = require("../middlewares/autenticacao");

// 🔍 Listar Salas (com filtros opcionais)
router.get("/", autenticacao, async (req, res) => {
  const { empresaId } = req;
  const { pesquisa, status, data_inicio, data_fim } = req.query;

  try {
    let query = knex("salas").where("empresa_id", empresaId);

    if (pesquisa) {
      query.where("nome", "ilike", `%${pesquisa}%`);
    }

    if (status && status !== "todos") {
      query.andWhere("status", "=", status);
    }

    if (data_inicio) {
      query.andWhere("data_cadastro", ">=", data_inicio);
    }

    if (data_fim) {
      query.andWhere("data_cadastro", "<=", data_fim);
    }

    const salas = await query;
    res.json(salas);
  } catch (error) {
    console.error("Erro ao buscar salas:", error);
    res.status(500).json({ erro: "Erro ao buscar salas." });
  }
});

// ➕ Criar Sala
router.post("/", autenticacao, async (req, res) => {
  const { empresaId, userId } = req;
  const { nome, descricao, status, permite_dois_agendamentos } = req.body;
  try {
    if (!nome) {
      return res.status(400).json({ erro: "O nome da sala é obrigatório." });
    }

    await knex("salas").insert({
      nome,
      descricao,
      status: status || "ativo",
      permite_dois_agendamentos: permite_dois_agendamentos ?? false,
      data_cadastro: knex.fn.now(),
      empresa_id: empresaId,
      usuario_criacao_id: userId
    });

    res.status(201).json({ mensagem: "Sala cadastrada com sucesso!" });
  } catch (error) {
    console.error("Erro ao cadastrar sala:", error);
    res.status(500).json({ erro: "Erro ao cadastrar sala." });
  }
});

// ✍️ Atualizar Sala
router.put("/:id", autenticacao, async (req, res) => {
  const { empresaId, userId } = req;
  const { id } = req.params;
  const { nome, descricao, status, permite_dois_agendamentos } = req.body;

  try {
    const salaExistente = await knex("salas").where({ id, empresa_id: empresaId }).first();
    if (!salaExistente) {
      return res.status(404).json({ erro: "Sala não encontrada." });
    }

    await knex("salas").where({ id, empresa_id: empresaId }).update({
      nome,
      descricao,
      status,
      permite_dois_agendamentos: permite_dois_agendamentos ?? false,
      data_atualizacao: knex.fn.now(),
      usuario_atualizacao_id: userId
    });

    res.json({ mensagem: "Sala atualizada com sucesso!" });
  } catch (error) {
    console.error("Erro ao atualizar sala:", error);
    res.status(500).json({ erro: "Erro ao atualizar sala." });
  }
});

// 🗑️ Excluir Sala
router.delete("/:id", autenticacao, async (req, res) => {
  const { empresaId } = req;
  const { id } = req.params;

  try {
    const sala = await knex("salas").where({ id, empresa_id: empresaId }).first();
    if (!sala) {
      return res.status(404).json({ erro: "Sala não encontrada." });
    }

    await knex("salas") .where({ id, empresa_id: empresaId })
      .del();

    res.json({ mensagem: "Sala excluída com sucesso!" });
  } catch (error) {
    console.error("Erro ao excluir sala:", error);
    res.status(500).json({ erro: "Erro ao excluir sala." });
  }
});

module.exports = router;
