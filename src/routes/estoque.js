// estoque.js


const express = require("express");
const router = express.Router();
const knex = require("../db/connection");
const autenticacao = require("../middlewares/autenticacao");


// ✅ Listar estoque com filtros e paginação
router.get("/estoque", autenticacao, async (req, res) => {
  try {
    const { empresaId } = req;
    const { grupo, sku, codigo, busca, status, page = 1, limit = 10 } = req.query;

    // Calcula o offset
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // 1. Query base com joins
    const queryBase = knex("produtos as p")
      .leftJoin("grupos as g", "p.grupo_id", "g.id")
      .select(
        "p.id",
        "p.nome",
        "p.codigo_sku",
        "p.codigo_barras_qr",
        "p.estoque_atual",
        "p.estoque_minimo",
        "g.nome as grupo_nome"
      )
      .where("p.empresa_id", empresaId)
      .andWhere("p.controla_estoque", true )
      .andWhere("p.status", "ativo");
     

    // 2. Filtros
    if (grupo) queryBase.andWhere("p.grupo_id", grupo);
    if (sku) queryBase.andWhere("p.codigo_sku", "ilike", `%${sku}%`);
    if (codigo) queryBase.andWhere("p.codigo_barras_qr", "ilike", `%${codigo}%`);
    if (busca) {
      queryBase.andWhere(function () {
        this.where("p.nome", "ilike", `%${busca}%`).orWhere(
          "p.descricao",
          "ilike",
          `%${busca}%`
        );
      });
    }

      if (status === "ativos") {
      queryBase.andWhere("status", "ativo");
    } else if (status === "inativos") {
      queryBase.andWhere("status", "inativo");
    }

    // 3. Conta total de registros com os filtros aplicados
const totalRegistros = await knex("produtos as p")
  .where("p.empresa_id", empresaId)
  .andWhere("p.controla_estoque", true)
  .andWhere("p.status", "ativo")
  .modify((qb) => {
    if (grupo) qb.andWhere("p.grupo_id", grupo);
    if (sku) qb.andWhere("p.codigo_sku", "ilike", `%${sku}%`);
    if (codigo) qb.andWhere("p.codigo_barras_qr", "ilike", `%${codigo}%`);
    if (busca) {
      qb.andWhere(function () {
        this.where("p.nome", "ilike", `%${busca}%`).orWhere(
          "p.descricao",
          "ilike",
          `%${busca}%`
        );
      });
    }
  })
  .count("* as count")
  .first();

const total = parseInt(totalRegistros.count);


 // 4. Busca os produtos da página atual
const produtosEstoque = await knex("produtos as p")
  .leftJoin("grupos as g", "p.grupo_id", "g.id")
  .select(
    "p.id",
    "p.nome",
    "p.codigo_sku",
    "p.codigo_barras_qr",
    "p.estoque_atual",
    "p.estoque_minimo",
    "g.nome as grupo_nome"
  )
  .where("p.empresa_id", empresaId)
  .andWhere("p.controla_estoque", true)
  .modify((qb) => {
    if (grupo) qb.andWhere("p.grupo_id", grupo);
    if (sku) qb.andWhere("p.codigo_sku", "ilike", `%${sku}%`);
    if (codigo) qb.andWhere("p.codigo_barras_qr", "ilike", `%${codigo}%`);
    if (busca) {
      qb.andWhere(function () {
        this.where("p.nome", "ilike", `%${busca}%`)
          .orWhere("p.descricao", "ilike", `%${busca}%`);
      });
    }

    // 🔥 filtro de status
    if (status === "ativos") {
      qb.andWhere("p.status", "ativo");
    } else if (status === "inativos") {
      qb.andWhere("p.status", "inativo");
    } else {
      // padrão: apenas ativos
      qb.andWhere("p.status", "ativo");
    }
  })
  .orderBy("p.nome", "asc")
  .limit(parseInt(limit))
  .offset(offset);



    // 5. Calcula total de páginas
    const totalPaginas = Math.ceil(total / parseInt(limit));

    // 6. Resposta padronizada igual ao produtos.js
    res.json({
      data: produtosEstoque,
      total: total,
      per_page: parseInt(limit),
      current_page: parseInt(page),
      last_page: totalPaginas,
    });
  } catch (error) {
    console.error("Erro ao buscar estoque:", error);
    res.status(500).json({ erro: "Erro ao buscar estoque." });
  }
});


// GET /api/produtos/disponiveis - Para o modal de movimentação
router.get("/disponiveis", autenticacao, async (req, res) => {
  try {
    const produtos = await knex("produtos")
      .where({ empresa_id: req.empresaId, controla_estoque: true, status: "ativo" })
      .select("id", "nome")
      .orderBy("nome");


    res.json(produtos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao listar produtos disponíveis." });
  }
});

// POST /api/estoque/movimentar
router.post("/estoque", autenticacao, async (req, res) => {
  try {
    const { produto_id, tipo, quantidade, justificativa } = req.body;

    if (!produto_id || !tipo || !quantidade || !justificativa) {
      return res.status(400).json({ erro: "Preencha todos os campos obrigatórios." });
    }

    const produto = await knex("produtos")
      .where({ id: produto_id, empresa_id: req.empresaId })
      .first();

    if (!produto) {
      return res.status(404).json({ erro: "Produto não encontrado." });
    }

    const qtd = parseFloat(quantidade);
    if (isNaN(qtd) || qtd <= 0) {
      return res.status(400).json({ erro: "Quantidade inválida." });
    }

    const estoqueAntes = parseFloat(produto.estoque_atual || 0);
    let estoqueDepois = estoqueAntes;

    switch (tipo) {
      case "entrada":
      case "ajuste+":
        estoqueDepois += qtd;
        break;
      case "saida":
      case "ajuste-":
        estoqueDepois -= qtd;
        break;
      default:
        return res.status(400).json({ erro: "Tipo de movimentação inválido." });
    }

    // Atualiza o estoque do produto
    await knex("produtos")
      .where({ id: produto.id })
      .update({ estoque_atual: estoqueDepois });

    // Registra a movimentação
    await knex("estoque_movimentacoes").insert({
      empresa_id: req.empresaId,
      produto_id,
      tipo,
      quantidade: qtd,
      estoque_antes: estoqueAntes,
      estoque_depois: estoqueDepois,
      data_movimentacao: knex.fn.now(),
      usuario_id: req.userId,
      observacao: justificativa,
    });

    res.json({ mensagem: "Movimentação registrada com sucesso." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao registrar movimentação." });
  }
});

router.get("/historico/:produto_id", autenticacao, async (req, res) => {
  try {
    const { produto_id } = req.params;
    const { inicio, fim } = req.query;

    const query = knex("estoque_movimentacoes as e")
      .leftJoin("usuarios as u", "e.usuario_id", "u.id")
      .where("e.produto_id", produto_id)
      .andWhere("e.empresa_id", req.empresaId)
      .select(
        "e.id",
        "e.tipo",
        "e.quantidade",
        "e.estoque_antes",
        "e.estoque_depois",
        "e.data_movimentacao",
        "e.observacao",
        "u.nome as usuario_nome"
      )
      .orderBy("e.data_movimentacao", "desc");

    if (inicio) query.andWhere("e.data_movimentacao", ">=", inicio);
    if (fim) query.andWhere("e.data_movimentacao", "<=", fim + " 23:59:59");

    const dados = await query;
    res.json(dados);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao buscar histórico de movimentações." });
  }
});



module.exports = router;
