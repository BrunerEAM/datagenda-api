const express = require("express");
const router = express.Router();
const knex = require("../db/connection");
const autenticacao = require("../middlewares/autenticacao");

// ==============================
// CRIAR DOCUMENTO
// ==============================
router.post("/", autenticacao, async (req, res) => {
  try {
    const { empresaId } = req;
    const { nome, estrutura_json, status } = req.body;

    const [novo] = await knex("documentos")
      .insert({
        nome,
        estrutura_json: JSON.stringify(Array.isArray(estrutura_json) ? estrutura_json : []),
        status: status || "ativo",
        empresa_id: empresaId,
      })
      .returning("*");

      console.log(novo);

    res.json(novo);
  } catch (err) {
    console.error("Erro ao criar documento:", err);
    res.status(500).json({ erro: "Erro ao criar documento" });
  }
});

// ==============================
// LISTAR DOCUMENTOS
// ==============================
router.get("/", autenticacao, async (req, res) => {
  try {
    const { empresaId } = req;
    const { status } = req.query;

    const query = knex("documentos")
      .select("id", "nome", "status", "updated_at")
      .where("empresa_id", empresaId);

    if (status === "ativos") query.andWhere("status", "ativo");
    if (status === "inativos") query.andWhere("status", "inativo");

    const data = await query.orderBy("updated_at", "desc");
    res.json({ data });
  } catch (err) {
    console.error("Erro ao listar documentos:", err);
    res.status(500).json({ erro: "Erro ao listar documentos" });
  }
});

// ==============================
// BUSCAR DOCUMENTO POR ID
// ==============================
router.get("/:id", autenticacao, async (req, res) => {
  try {
    const { empresaId } = req;
    const { id } = req.params;

    const documento = await knex("documentos")
      .where({ id, empresa_id: empresaId })
      .first();

    if (!documento) {
      return res.status(404).json({ erro: "Documento não encontrado" });
    }

    // Normalizar estrutura_json
    let estrutura = [];
    try {
      estrutura =
  typeof documento.estrutura_json === "string" ? JSON.parse(documento.estrutura_json): Array.isArray(documento.estrutura_json)? documento.estrutura_json: [];

    } catch {
      estrutura = [];
    }

    res.json({ ...documento, estrutura_json: estrutura });
  } catch (err) {
    console.error("Erro ao buscar documento:", err);
    res.status(500).json({ erro: "Erro ao buscar documento" });
  }
});

// ==============================
// ATUALIZAR DOCUMENTO
// ==============================
router.put("editar/:id", autenticacao, async (req, res) => {
  try {
    const { empresaId } = req;
    const { id } = req.params;
    const { nome, estrutura_json, status } = req.body;

    const atualizado = await knex("documentos")
      .where({ id, empresa_id: empresaId })
      .update({
        nome,
        estrutura_json: JSON.stringify(Array.isArray(estrutura_json) ? estrutura_json : []),
        status: status || "ativo",
        updated_at: knex.fn.now(),
      })
      .returning("*");

    if (!atualizado.length) {
      return res.status(404).json({ erro: "Documento não encontrado" });
    }

    res.json(atualizado[0]);
  } catch (err) {
    console.error("Erro ao atualizar documento:", err);
    res.status(500).json({ erro: "Erro ao atualizar documento" });
  }
});

// ==============================
// DELETAR DOCUMENTO
// ==============================
router.delete("/:id", autenticacao, async (req, res) => {
  try {
    const { empresaId } = req;
    const { id } = req.params;

    await knex("documentos").where({ id, empresa_id: empresaId }).del();
    res.json({ mensagem: "Documento excluído com sucesso!" });
  } catch (err) {
    console.error("Erro ao excluir documento:", err);
    res.status(500).json({ erro: "Erro ao excluir documento" });
  }   
})

module.exports = router;
