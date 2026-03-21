const express = require("express");
const router = express.Router();
const knex = require("../db/connection");
const autenticacao = require("../middlewares/autenticacao");
const axios = require("axios");

// ✅ Listar feriados
router.get("/", autenticacao, async (req, res) => {
  try {
    const { empresaId } = req;
    const { ano, abrangencia, status, pesquisa } = req.query;

    const query = knex("feriados").where("empresa_id", empresaId);

    if (ano) {
      query.andWhereRaw("extract(year from data) = ?", [ano]);
    }

    if (abrangencia) {
      query.andWhere("abrangencia", abrangencia);
    }

    if (status) {
      query.andWhere("status", status);
    }

    if (pesquisa) {
      query.andWhere(function () {
        this.where("descricao", "ilike", `%${pesquisa}%`);
      });
    }

    const feriados = await query.orderBy("data", "asc");
    res.json(feriados);
  } catch (error) {
    console.error("Erro ao buscar feriados:", error);
    res.status(500).json({ erro: "Erro ao buscar feriados." });
  }
});

// ✅ Buscar feriado por ID
router.get("/:id", autenticacao, async (req, res) => {
  try {
    const { id } = req.params;
    const { empresaId } = req;

    const feriado = await knex("feriados")
      .where({ id, empresa_id: empresaId })
      .first();

    if (!feriado) {
      return res.status(404).json({ erro: "Feriado não encontrado." });
    }

    res.json(feriado);
  } catch (error) {
    console.error("Erro ao buscar feriado:", error);
    res.status(500).json({ erro: "Erro ao buscar feriado." });
  }
});

// ✅ Criar feriado
router.post("/", autenticacao, async (req, res) => {
  try {
    const { empresaId, userId } = req;
    const {
      data,
      descricao,
      abrangencia = "nacional",
      uf,
      municipio,
      status = "ativo",
    } = req.body;

    if (!data || !descricao) {
      return res
        .status(400)
        .json({ erro: "Data e descrição são obrigatórios." });
    }

    await knex("feriados").insert({
      data,
      descricao,
      abrangencia,
      uf: uf || null,
      municipio: municipio || null,
      status,
      empresa_id: empresaId,
      usuario_criacao_id: userId,
      data_cadastro: knex.fn.now(),
      data_atualizacao: knex.fn.now(),
    });

    res.status(201).json({ mensagem: "Feriado cadastrado com sucesso!" });
  } catch (error) {
    console.error("Erro ao cadastrar feriado:", error);
    res.status(500).json({ erro: "Erro ao cadastrar feriado." });
  }
});

// ✅ Atualizar feriado
router.put("/:id", autenticacao, async (req, res) => {
  try {
    const { id } = req.params;
    const { empresaId, userId } = req;
    const {
      data,
      descricao,
      abrangencia = "nacional",
      uf,
      municipio,
      status = "ativo",
    } = req.body;

    const feriado = await knex("feriados")
      .where({ id, empresa_id: empresaId })
      .first();

    if (!feriado) {
      return res.status(404).json({ erro: "Feriado não encontrado." });
    }

    await knex("feriados")
      .where({ id, empresa_id: empresaId })
      .update({
        data,
        descricao,
        abrangencia,
        uf: uf || null,
        municipio: municipio || null,
        status,
        atualizado_por: userId,
        data_atualizacao: knex.fn.now(),
      });

    res.json({ mensagem: "Feriado atualizado com sucesso!" });
  } catch (error) {
    console.error("Erro ao atualizar feriado:", error);
    res.status(500).json({ erro: "Erro ao atualizar feriado." });
  }
});

// ✅ Excluir feriado
router.delete("/:id", autenticacao, async (req, res) => {
  try {
    const { id } = req.params;
    const { empresaId } = req;

    const feriado = await knex("feriados")
      .where({ id, empresa_id: empresaId })
      .first();

    if (!feriado) {
      return res.status(404).json({ erro: "Feriado não encontrado." });
    }

    await knex("feriados").where({ id, empresa_id: empresaId }).del();

    res.json({ mensagem: "Feriado excluído com sucesso!" });
  } catch (error) {
    console.error("Erro ao excluir feriado:", error);
    res.status(500).json({ erro: "Erro ao excluir feriado." });
  }
});

// ✅ Importar feriados nacionais via BrasilAPI
router.post("/importar/:ano", autenticacao, async (req, res) => {
  try {
    const { ano } = req.params;
    const { empresaId, userId } = req;

    const response = await axios.get(
      `https://brasilapi.com.br/api/feriados/v1/${ano}`
    );

    const feriados = response.data;

    const dados = feriados.map((f) => ({
      data: f.date,
      descricao: f.name,
      abrangencia: "nacional",
      uf: null,
      municipio: null,
      status: "ativo",
      empresa_id: empresaId,
      usuario_criacao_id: userId,
      data_cadastro: knex.fn.now(),
      data_atualizacao: knex.fn.now(),
    }));

    await knex("feriados").insert(dados);

    res.json({ mensagem: "Feriados nacionais importados com sucesso!" });
  } catch (error) {
    console.error("Erro ao importar feriados:", error);
    res.status(500).json({ erro: "Erro ao importar feriados." });
  }
});

module.exports = router;
