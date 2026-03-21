
// ✅ Arquivo: unidades.js

const express = require("express");
const router = express.Router();
const knex = require("../db/connection");
const autenticacao = require("../middlewares/autenticacao");

// ✅ Listar unidades
router.get("/", autenticacao, async (req, res) => {
  try {
    const { empresaId } = req;
    const { filtro, pesquisa } = req.query;

    let query = knex("unidades_medida").where({ empresa_id: empresaId });

    if (filtro === "ativos") query.andWhere("status", "ativo");
    if (filtro === "inativos") query.andWhere("status", "inativo");

    if (pesquisa) {
      query.andWhere((qb) => {
        qb.where("nome", "ilike", `%${pesquisa}%`)
          .orWhere("sigla", "ilike", `%${pesquisa}%`);
      });
    }

    const unidades = await query.select();
    res.json(unidades);
  } catch (error) {
    console.error("Erro ao buscar unidades:", error);
    res.status(500).json({ erro: "Erro ao buscar unidades de medida." });
  }
});

// ✅ Buscar unidade específica
router.get("/:id", autenticacao, async (req, res) => {
  try {
    const { id } = req.params;
    const { empresaId } = req;

    const unidade = await knex("unidades_medida")
      .where({ id, empresa_id: empresaId })
      .first();

    if (!unidade) {
      return res.status(404).json({ erro: "Unidade não encontrada." });
    }

    res.json(unidade);
  } catch (error) {
    console.error("Erro ao buscar unidade:", error);
    res.status(500).json({ erro: "Erro ao buscar unidade de medida." });
  }
});

// ✅ Cadastrar unidade
router.post("/", autenticacao, async (req, res) => {
  try {
    const { nome, sigla, status } = req.body;
    const { empresaId, userId } = req;

    if (!nome || !sigla) {
      return res.status(400).json({ erro: "Nome e Sigla são obrigatórios." });
    }

    const existe = await knex("unidades_medida")
      .where({ sigla: sigla.toLowerCase(), empresa_id: empresaId })
      .first();

    if (existe) {
      return res.status(400).json({ erro: "Sigla já cadastrada para esta empresa." });
    }

    const [id] = await knex("unidades_medida").insert({
      nome,
      sigla: sigla.toLowerCase(),
      status: status || "ativo",
      empresa_id: empresaId,
      usuario_criacao_id: userId,
      data_cadastro: knex.fn.now(),
      data_atualizacao: knex.fn.now(),
    }, ["id"]);

    res.status(201).json({ mensagem: "Unidade cadastrada com sucesso!", id });
  } catch (error) {
    console.error("Erro ao cadastrar unidade:", error);
    res.status(500).json({ erro: "Erro ao cadastrar unidade de medida." });
  }
});

// ✅ Atualizar unidade
router.put("/:id", autenticacao, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, sigla, status } = req.body;
    const { empresaId, userId } = req;

    const unidade = await knex("unidades_medida")
      .where({ id, empresa_id: empresaId })
      .first();

    if (!unidade) {
      return res.status(404).json({ erro: "Unidade não encontrada." });
    }

    const dadosAtualizados = {
      nome,
      sigla: sigla.toLowerCase(),
      status: status || "ativo",
      atualizado_por: userId,
      data_atualizacao: knex.fn.now(),
    };

    await knex("unidades_medida")
      .where({ id, empresa_id: empresaId })
      .update(dadosAtualizados);

    res.json({ mensagem: "Unidade atualizada com sucesso!" });
  } catch (error) {
    console.error("Erro ao atualizar unidade:", error);
    res.status(500).json({ erro: "Erro ao atualizar unidade de medida." });
  }
});

// ✅ Excluir unidade
router.delete("/:id", autenticacao, async (req, res) => {
  try {
    const { id } = req.params;
    const { empresaId } = req;

    const unidade = await knex("unidades_medida")
      .where({ id, empresa_id: empresaId })
      .first();

    if (!unidade) {
      return res.status(404).json({ erro: "Unidade não encontrada." });
    }

    await knex("unidades_medida")
      .where({ id, empresa_id: empresaId })
      .del();

    res.json({ mensagem: "Unidade excluída com sucesso!" });
  } catch (error) {
    console.error("Erro ao excluir unidade:", error);
    res.status(500).json({ erro: "Erro ao excluir unidade de medida." });
  }
});

module.exports = router;
