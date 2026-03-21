const express = require("express");
const router = express.Router();
const knex = require("../db/connection");

function sanitizeItemId(value) {
  if (value && typeof value === "object" && "id" in value) {
    return parseInt(value.id, 10);
  }
  return parseInt(value, 10);
}

function sanitizeNumber(value) {
  if (value === null || value === undefined) return null;
  return typeof value === "number"
    ? value
    : parseFloat(value.toString().replace(",", "."));
}

// 🔍 Buscar Conjuntos
router.get("/", async (req, res) => {
  try {
    const { pesquisa, status, tipo } = req.query;
    let query = knex("conjuntos").select();

    if (pesquisa)        query.where("nome", "ilike", `%${pesquisa}%`);
    if (status && status !== "todos") query.andWhere("status", status);
    if (tipo   && tipo   !== "todos") query.andWhere("tipo", tipo);

    const resultado = await query;
    res.json(resultado);
  } catch (error) {
    console.error("GET /api/conjuntos erro:", error);
    res.status(500).json({ erro: "Erro ao buscar os conjuntos." });
  }
});

// 🔗 Buscar Itens do Conjunto
router.get("/:id/itens", async (req, res) => {
  try {
    const { id } = req.params;
    const itens = await knex("conjunto_itens").where({ conjunto_id: id });
    res.json(itens);
  } catch (error) {
    console.error("GET /api/conjuntos/:id/itens erro:", error);
    res.status(500).json({ erro: "Erro ao buscar os itens do conjunto." });
  }
});

// ✅ Cadastrar Conjunto
router.post("/", async (req, res) => {
  try {
    const {
      tipo, nome, descricao_publica, observacoes_internas,
      valor, status, permitir_alterar_valor, controla_sessoes,
      validade_dias, exige_agendamento, permite_venda_online,
      permite_desconto_manual, permite_parcelamento, itens,
    } = req.body;

    if (!nome || !tipo || !Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({ erro: "Preencha nome, tipo e ao menos um item." });
    }

    // Geração automática do código sequencial
    const ultimo = await knex("conjuntos").max("codigo as max");
    const novoCodigo = (ultimo[0].max || 0) + 1;

    // INSERE e recupera o objeto retornado
    const inserted = await knex("conjuntos")
      .insert({
        codigo: novoCodigo,
        tipo, nome, descricao_publica, observacoes_internas,
        valor: sanitizeNumber(valor), status,
        permitir_alterar_valor: Boolean(permitir_alterar_valor),
        controla_sessoes: Boolean(controla_sessoes),
        validade_dias: validade_dias ? parseInt(validade_dias, 10) : null,
        exige_agendamento: Boolean(exige_agendamento),
        permite_venda_online: Boolean(permite_venda_online),
        permite_desconto_manual: Boolean(permite_desconto_manual),
        permite_parcelamento: Boolean(permite_parcelamento),
      })
      .returning("id");

    // Extrai o número puro
    const conjunto_id = (inserted[0] && inserted[0].id !== undefined)
      ? inserted[0].id
      : inserted[0];

    // Sanitiza itens
    const itensFormatados = itens.map((item) => ({
      conjunto_id,
      tipo_item: String(item.tipo_item),
      item_id: sanitizeItemId(item.item_id),
      quantidade: parseInt(item.quantidade, 10),
      valor_unitario: sanitizeNumber(item.valor_unitario),
      valor_total: sanitizeNumber(item.valor_total),
    }));

    await knex("conjunto_itens").insert(itensFormatados);

    res.status(201).json({ mensagem: "Conjunto cadastrado com sucesso!" });
  } catch (error) {
    console.error("POST /api/conjuntos erro:", error);
    res.status(500).json({ erro: "Erro ao cadastrar o conjunto." });
  }
});

// ✏️ Atualizar Conjunto
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tipo, nome, descricao_publica, observacoes_internas,
      valor, status, permitir_alterar_valor, controla_sessoes,
      validade_dias, exige_agendamento, permite_venda_online,
      permite_desconto_manual, permite_parcelamento, itens,
    } = req.body;

    await knex("conjuntos").where({ id }).update({
      tipo, nome, descricao_publica, observacoes_internas,
      valor: sanitizeNumber(valor), status,
      permitir_alterar_valor: Boolean(permitir_alterar_valor),
      controla_sessoes: Boolean(controla_sessoes),
      validade_dias: validade_dias ? parseInt(validade_dias, 10) : null,
      exige_agendamento: Boolean(exige_agendamento),
      permite_venda_online: Boolean(permite_venda_online),
      permite_desconto_manual: Boolean(permite_desconto_manual),
      permite_parcelamento: Boolean(permite_parcelamento),
    });

    await knex("conjunto_itens").where({ conjunto_id: id }).del();

    const itensFormatados = itens.map((item) => ({
      conjunto_id: id,
      tipo_item: String(item.tipo_item),
      item_id: sanitizeItemId(item.item_id),
      quantidade: parseInt(item.quantidade, 10),
      valor_unitario: sanitizeNumber(item.valor_unitario),
      valor_total: sanitizeNumber(item.valor_total),
    }));

    await knex("conjunto_itens").insert(itensFormatados);

    res.json({ mensagem: "Conjunto atualizado com sucesso!" });
  } catch (error) {
    console.error(`PUT /api/conjuntos/${req.params.id} erro:`, error);
    res.status(500).json({ erro: "Erro ao atualizar o conjunto." });
  }
});

// 🗑️ Excluir Conjunto
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await knex("conjuntos").where({ id }).del();
    res.json({ mensagem: "Conjunto excluído com sucesso!" });
  } catch (error) {
    console.error(`DELETE /api/conjuntos/${req.params.id} erro:`, error);
    res.status(500).json({ erro: "Erro ao excluir o conjunto." });
  }
});

module.exports = router;
