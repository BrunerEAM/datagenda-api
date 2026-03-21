// ✅ pacotes.js - Backend dos Serviços (corrigido)


const express = require("express");
const router = express.Router();
const knex = require("../db/connection");
const autenticacao = require("../middlewares/autenticacao");
//const { default: Pacotes } = require("../../frontend/src/pages/pacotes");

// Listar pacotes
router.get("/", autenticacao, async (req, res) => {
  try {
    const { empresaId } = req;
    const { grupo_id, busca, status, page = 1, limit = 10 } = req.query;
   
    const pageInt = parseInt(page, 10) || 1;
    const limitInt = parseInt(limit, 10) || 10;
    const offset = (pageInt - 1) * limitInt;

    // 1. Query base
    let queryBase = knex("pacotes").where({ empresa_id: empresaId });

    // 2. Aplicar filtros
    if (grupo_id) queryBase.andWhere("grupo_id", grupo_id);

   if (busca) {
  queryBase.andWhere(function () {
    this.where("nome", "ilike", `%${busca}%`)
        .orWhere("observacoes_internas", "ilike", `%${busca}%`)
        .orWhere("observacoes_externas", "ilike", `%${busca}%`);
  });
}


    if (status === "ativos") {
      queryBase.andWhere("status", "ativo");
    } else if (status === "inativos") {
      queryBase.andWhere("status", "inativo");
    }

     // 3. Contagem total
    const totalRegistros = await queryBase.clone().count("* as count").first();
    const total = parseInt(totalRegistros.count);

     // 4. Buscar serviços paginados
    const Pacotes = await queryBase
      .clone()
      .orderBy("nome", "asc")
      .limit(limitInt)
      .offset(offset);

      // 5. Resposta formatada
    res.json({
      data: Pacotes,
      total: total,
      per_page: limitInt,
      current_page: pageInt,
      last_page: Math.ceil(total / limitInt),
    });

  } catch (error) {
    console.error("Erro ao listar pacotes:", error);
    res.status(500).json({ erro: "Erro ao listar pacotes" });
  }
});

// Produtos
router.get("/produtos", autenticacao, async (req, res) => {
  try {
    const produtos = await knex("produtos")
      .where({ empresa_id: req.empresaId, status: "ativo" })
      .select("id", "nome", "preco_venda");
    res.json(produtos);
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    res.status(500).json({ erro: "Erro ao buscar produtos." });
  }
});

// Serviços
router.get("/servicos", autenticacao, async (req, res) => {
  try {
    const servicos = await knex("servicos")
      .where({ empresa_id: req.empresaId, status: "ativo" })
      .select("id", "nome", "preco_venda", "controla_pacote", "quantidade_sessoes");
    res.json(servicos);
  } catch (error) {
    console.error("Erro ao buscar pacotes:", error);
    res.status(500).json({ erro: "Erro ao buscar pacotes." });
  }
});

// Buscar pacote por ID
router.get("/:id", autenticacao, async (req, res) => {
  try {
    const { id } = req.params;
    const pacote = await knex("pacotes")
      .where({ id, empresa_id: req.empresaId })
      .first();

    if (!pacote) return res.status(404).json({ erro: "Pacote não encontrado" });

    const itens = await knex("pacote_itens").where("pacote_id", id);
    res.json({ ...pacote, itens });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar pacotes" });
  }
});

// Criar novo pacote
router.post("/", autenticacao, async (req, res) => {
  const {
    nome,
    status,
    valor_total,
    observacoes_internas,
    observacoes_externas,
    validade_dias,
    comissao_percentual,
    permite_alterar_valor,
    venda_online,
    sessoes_totais,
    itens = [],
  } = req.body;

  const trx = await knex.transaction();

  try {
    const [pacote_id] = await trx("pacotes")
      .insert({
        empresa_id: req.empresaId,
        nome,
        status,
        valor_total,
        observacoes_internas,
        observacoes_externas,
        validade_dias: validade_dias || 0,
        comissao_percentual: comissao_percentual || 0,
        permite_alterar_valor,
        venda_online,
        sessoes_totais,
      })
      .returning("id");

    const pacoteId = typeof pacote_id === "object" ? pacote_id.id : pacote_id;

    for (const item of itens) {
  
      if (item.tipo === "Pacote") {
        // Buscar os subitens do pacote incluído
        const subItens = await trx("pacote_itens").where("pacote_id", item.item_id);
        const nomePacoteItens = await trx("pacotes").where("id", item.item_id).first();

        for (const sub of subItens) {
          await trx("pacote_itens").insert({
            empresa_id: req.empresaId,
            pacote_id: pacoteId,
            pacote_nome: `${nome}`,
            tipo: "Pacote",
            item_id: sub.item_id,
            nome_item: `(${nomePacoteItens.nome})  ${sub.nome_item}`,
            quantidade: sub.quantidade * (item.quantidade || 1),
            valor_unitario: sub.valor_unitario,
            valor_total: sub.valor_unitario * sub.quantidade * (item.quantidade || 1),
            sessoes: sub.sessoes * (item.quantidade || 1),
          });
        }
      } else {
        // Produto ou Serviço direto
        await trx("pacote_itens").insert({
          empresa_id: req.empresaId,
          pacote_id: pacoteId,
          tipo: item.tipo,
          item_id: item.item_id,
          pacote_nome: `${nome}`,
          nome_item: item.nome_item,
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario,
          valor_total: item.valor_total,
          sessoes: item.sessoes * item.quantidade || 0,
        });
      }
    }

    await trx.commit();
    res.status(201).json({ sucesso: true });
  } catch (error) {
    await trx.rollback();
    console.error("Erro ao criar pacote:", error);
    res.status(500).json({ erro: "Erro ao criar pacote" });
  }
});

// Atualizar pacote
router.put("/:id", autenticacao, async (req, res) => {
  const { id } = req.params;
  const {
    nome,
    status,
    valor_total,
    observacoes_internas,
    observacoes_externas,
    validade_dias,
    comissao_percentual,
    permite_alterar_valor,
    venda_online,
    sessoes_totais,
    itens = [],
  } = req.body;

  const trx = await knex.transaction();

  try {
    await trx("pacotes")
      .where({ id, empresa_id: req.empresaId })
      .update({
        nome,
        status,
        valor_total,
        observacoes_internas,
        observacoes_externas,
        validade_dias,
        comissao_percentual,
        permite_alterar_valor,
        venda_online,
        sessoes_totais,
      });

    await trx("pacote_itens").where("pacote_id", id).del();
    

    for (const item of itens) {
      if (item.tipo === "Pacote") {
        // Expandir subitens do pacote incluído
        const subItens = await trx("pacote_itens").where("pacote_id", item.item_id);
        const nomePacoteItens = await trx("pacotes").where("id", item.item_id).first();

        for (const sub of subItens) {
          await trx("pacote_itens").insert({
            empresa_id: req.empresaId,
            pacote_id: id,
            tipo: "Pacote",
            item_id: sub.item_id,
            pacote_nome: `${nome} `,
            nome_item: `(${nomePacoteItens.nome})  ${sub.nome_item}`,
            quantidade: sub.quantidade * (item.quantidade || 1),
            valor_unitario: sub.valor_unitario,
            valor_total: sub.valor_unitario * sub.quantidade * (item.quantidade || 1),
            sessoes: sub.sessoes * (item.quantidade || 1),
          });
        }
      } else {
        await trx("pacote_itens").insert({
          empresa_id: req.empresaId,
          pacote_id: id,
          tipo: item.tipo,
          item_id: item.item_id,
          pacote_nome: `${nome} `,
          nome_item: item.nome_item,
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario,
          valor_total: item.valor_total,
          sessoes: item.sessoes * item.quantidade || 0,
        });
      }
    }

    await trx.commit();
    res.json({ sucesso: true });
  } catch (error) {
    await trx.rollback();
    console.error("Erro ao atualizar pacote:", error);
    res.status(500).json({ erro: "Erro ao atualizar pacote" });
  }
});

// Excluir pacote
router.delete("/:id", autenticacao, async (req, res) => {
  const { id } = req.params;
  const trx = await knex.transaction();

  try {
    await trx("pacote_itens").where("pacote_id", id).del();
    await trx("pacotes").where({ id, empresa_id: req.empresaId }).del();
    await trx.commit();
    res.json({ sucesso: true });
  } catch (error) {
    await trx.rollback();
    console.error("Erro ao excluir pacote:", error);
    res.status(500).json({ erro: "Erro ao excluir pacote" });
  }
});

module.exports = router;
