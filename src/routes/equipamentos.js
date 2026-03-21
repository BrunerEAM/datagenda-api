const express = require("express");
const router = express.Router();
const knex = require("../db/connection");
const autenticacao = require("../middlewares/autenticacao");

// ✅ Listar equipamentos
router.get("/", autenticacao, async (req, res) => {
  const { empresaId } = req;
  const { pesquisa, status, data_inicio, data_fim } = req.query;

  try {
    let query = knex("equipamentos").where("empresa_id", empresaId);

    if (pesquisa) {
      query.andWhere(function () {
        this.where("nome", "ilike", `%${pesquisa}%`)
            .orWhere("descricao", "ilike", `%${pesquisa}%`);
      });
    }

    if (status && status !== "todos") {
      query.andWhere("status", status);
    }

    if (data_inicio) {
      query.andWhere("data_cadastro", ">=", data_inicio);
    }

    if (data_fim) {
      query.andWhere("data_cadastro", "<=", data_fim);
    }

    const resultados = await query.orderBy("nome", "asc");
    res.json(resultados);
  } catch (error) {
    console.error("Erro ao buscar equipamentos:", error);
    res.status(500).json({ erro: "Erro ao buscar equipamentos." });
  }
});

// ✅ Criar equipamento
router.post("/", autenticacao, async (req, res) => {
  const { empresaId, userId } = req;
  const { nome, descricao, status, permite_dois_agendamentos } = req.body;

  try {
    if (!nome) {
      return res.status(400).json({ erro: "O nome é obrigatório." });
    }

    await knex("equipamentos").insert({
      nome,
      descricao,
      status: status || "ativo",
      permite_dois_agendamentos: permite_dois_agendamentos ?? false,
      empresa_id: empresaId,
      usuario_criacao_id: userId,
      data_cadastro: knex.fn.now(),
      data_atualizacao: knex.fn.now(),
    });

    res.status(201).json({ mensagem: "✅ Equipamento cadastrado com sucesso!" });
  } catch (error) {
    console.error("Erro ao cadastrar equipamento:", error);
    res.status(500).json({ erro: "Erro ao cadastrar equipamento." });
  }
});

// ✅ Atualizar equipamento
router.put("/:id", autenticacao, async (req, res) => {
  const { empresaId, userId } = req;
  const { id } = req.params;
  const { nome, descricao, status, permite_dois_agendamentos } = req.body;

  try {
    const equipamento = await knex("equipamentos")
      .where({ id, empresa_id: empresaId })
      .first();

    if (!equipamento) {
      return res.status(404).json({ erro: "Equipamento não encontrado." });
    }

    await knex("equipamentos")
      .where({ id, empresa_id: empresaId })
      .update({
        nome,
        descricao,
        status: status || "ativo",
        permite_dois_agendamentos: permite_dois_agendamentos ?? false,
        atualizado_por: userId,
        data_atualizacao: knex.fn.now(),
      });

    res.json({ mensagem: "✅ Equipamento atualizado com sucesso!" });
  } catch (error) {
    console.error("Erro ao atualizar equipamento:", error);
    res.status(500).json({ erro: "Erro ao atualizar equipamento." });
  }
});

// ✅ Excluir equipamento
router.delete("/:id", autenticacao, async (req, res) => {
  const { empresaId } = req;
  const { id } = req.params;

  try {
    const equipamento = await knex("equipamentos").where({ id, empresa_id: empresaId }).first();

    if (!equipamento) {
      return res.status(404).json({ erro: "Equipamento não encontrado." });
    }

    await knex("equipamentos")
      .where({ id, empresa_id: empresaId })
      .del();

    res.json({ mensagem: "🗑️ Equipamento excluído com sucesso!" });
  } catch (error) {
    console.error("Erro ao excluir equipamento:", error);
    res.status(500).json({ erro: "Erro ao excluir equipamento." });
  }
});

module.exports = router;
