// routes/produtos.js

const express = require("express");
const router = express.Router();
const knex = require("../db/connection");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const autenticacao = require("../middlewares/autenticacao");

// Configuração do upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const empresaId = req.empresaId;
    const dir = `uploads/${empresaId}/produtos`;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const nomeArquivo = `produto_${Date.now()}${ext}`;
    cb(null, nomeArquivo);
  },
});
const upload = multer({ storage });


// ✅ Listar produtos com filtros
router.get("/", autenticacao, async (req, res) => {
  try {
    const { empresaId } = req;
    // Recebe os parâmetros de paginação e filtros do frontend
    const { grupo_id, codigo_sku, codigo_barras_qr, busca, status, page = 1, limit = 10 } = req.query;

    // Calcula o offset para a consulta
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // 1. Primeiro, construímos a query base com todos os filtros
    const queryBase = knex("produtos").where({ empresa_id: empresaId });

    if (grupo_id) queryBase.andWhere("grupo_id", grupo_id);
    if (codigo_sku) queryBase.andWhere("codigo_sku", "ilike", `%${codigo_sku}%`);
    if (codigo_barras_qr) queryBase.andWhere("codigo_barras_qr", "ilike", `%${codigo_barras_qr}%`);

    if (busca) {
      queryBase.andWhere(function () {
        this.where("nome", "ilike", `%${busca}%`).orWhere("descricao", "ilike", `%${busca}%`);
      });
    }

    if (status === "ativos") {
      queryBase.andWhere("status", "ativo");
    } else if (status === "inativos") {
      queryBase.andWhere("status", "inativo");
    }

    // 2. Contamos o total de registros com base na query dos filtros
    const totalRegistros = await queryBase.clone().count("* as count").first();
    const total = parseInt(totalRegistros.count);
    
    // 3. Executamos a query com os limites e offset para pegar os produtos da página atual
    const produtos = await queryBase
      .clone()
      .orderBy("nome", "asc")
      .limit(parseInt(limit))
      .offset(offset);

    // 4. Calculamos o total de páginas e montamos a resposta final
    const totalPaginas = Math.ceil(total / parseInt(limit));

    res.json({
      data: produtos,
      total: total,
      per_page: parseInt(limit),
      current_page: parseInt(page),
      last_page: totalPaginas,
    });
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    res.status(500).json({ erro: "Erro ao buscar produtos." });
  }
});


// Cadastro de produto
router.post("/", autenticacao, upload.single("foto"), async (req, res) => {
  try {
    const { empresaId, userId } = req;
    const dados = req.body;

    // Conversões de campos numéricos (evita string no banco)
    const preco_venda = parseFloat(dados.preco_venda) || 0;
    const custo = parseFloat(dados.custo) || 0;
    const percentual_lucro = preco_venda && custo ? (((preco_venda - custo) / custo) * 100).toFixed(2) : 0;
    const valor_liquido = preco_venda - custo;
    const controla_estoque = dados.controla_estoque === "1";
    const estoque_minimo = parseInt(dados.estoque_minimo) || 0;
    const estoque_atual = parseInt(dados.estoque_atual) || 0;

    const foto = req.file ? `${empresaId}/produtos/${req.file.filename}` : null;

    const [id] = await knex("produtos").insert({
      empresa_id: empresaId,
      codigo_sku: dados.codigo_sku || null,
      nome: dados.nome,
      descricao: dados.descricao || null,
      preco_venda,
      custo,
      percentual_lucro,
      valor_liquido,
      grupo_id: dados.grupo_id || null,
      unidade_id: dados.unidade_id || null,
      status: dados.status || "ativo",
      controla_estoque: controla_estoque,
      estoque_minimo,
      estoque_atual,
      codigo_barras_qr: dados.codigo_barras_qr || null,
      foto,
      usuario_criacao_id: userId,
      usuario_atualizacao_id: userId,
      data_cadastro: knex.fn.now(),
      data_atualizacao: knex.fn.now(),
    }, ["id"]);


    res.status(201).json({ mensagem: "✅ Produto cadastrado com sucesso!", id: id.id || id });

    console.log("✅ Produtos recebidos!:" + JSON.stringify(dados));
  } catch (error) {
    console.error("Erro ao cadastrar produto:", error);
    res.status(500).json({ erro: "Erro ao cadastrar produto." });
  }
});

// Atualização de produto
router.put("/:id", autenticacao, upload.single("foto"), async (req, res) => {
  try {
    const { empresaId, userId } = req;
    const { id } = req.params;
    const dados = req.body;

    // Verifica se o produto existe dentro da empresa
    const produto = await knex("produtos").where({ id, empresa_id: empresaId }).first();
    if (!produto) {
      return res.status(404).json({ erro: "Produto não encontrado." });
    }

    // Conversões de campos numéricos
    const preco_venda = parseFloat(dados.preco_venda) || 0;
    const custo = parseFloat(dados.custo) || 0;
    const percentual_lucro = preco_venda && custo ? (((preco_venda - custo) / custo) * 100).toFixed(2) : 0;
    const valor_liquido = preco_venda - custo;
    const converted_controla_estoque = dados.controla_estoque === "1";
    const estoque_minimo = parseInt(dados.estoque_minimo) || 0;
    const estoque_atual = parseInt(dados.estoque_atual) || 0;
    const novaFoto = req.file ? `${empresaId}/produtos/${req.file.filename}` : produto.foto;
    

    if (req.file && produto.foto && produto.foto !== novaFoto) {
      const caminhoAntigo = path.join(__dirname, "..", "uploads", produto.foto);
      if (fs.existsSync(caminhoAntigo)) {
        fs.unlinkSync(caminhoAntigo);
      }
    }
   
    // Dados atualizados
    const dadosAtualizados = {
      codigo_sku: dados.codigo_sku || null,
      nome: dados.nome,
      descricao: dados.descricao || null,
      preco_venda,
      custo,
      percentual_lucro,
      valor_liquido,
      grupo_id: dados.grupo_id || null,
      unidade_id: dados.unidade_id || null,
      status: dados.status || "ativo",
      controla_estoque: converted_controla_estoque,
      estoque_minimo,
      estoque_atual,
      codigo_barras_qr: dados.codigo_barras_qr || null,
      foto: novaFoto,
      usuario_atualizacao_id: userId,
      data_atualizacao: knex.fn.now(),
    };

    // Salva no banco
    await knex("produtos").where({ id, empresa_id: empresaId }).update(dadosAtualizados);

    // Auditoria - Compara e grava histórico de alterações
    for (const campo in dadosAtualizados) {
      const novoValor = dadosAtualizados[campo];
      const antigoValor = produto[campo];

      if (`${novoValor}` !== `${antigoValor}`) {
        await knex("produtos_historico").insert({
          produto_id: id,
          empresa_id: empresaId,
          usuario_id: userId,
          campo_alterado: campo,
          valor_antigo: antigoValor,
          valor_novo: novoValor,
          data_alteracao: knex.fn.now(),
        });
      }
    }

    res.json({ mensagem: "✅ Produto atualizado com sucesso!" });
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    res.status(500).json({ erro: "Erro ao atualizar produto." });
  }
});

// Exclusão de produto
router.delete("/:id", autenticacao, async (req, res) => {
  try {
    const { empresaId, userId } = req;
    const { id } = req.params;
    const produtoSaldo = await knex("produtos").where({ id, empresa_id: empresaId }).first();

    // Valida se o produto existe na empresa correta
    const produto = await knex("produtos").where({ id, empresa_id: empresaId }).first();

    if (!produto) {
      return res.status(404).json({ erro: "Produto não encontrado." });
    }
    if (produtoSaldo.estoque_atual > 0) {
      return res.status(404).json({ erro: "ATENÇÃO! Atualize o saldo do produto antes de exclui-lo." });
    }
    // ⚠️ Remover imagem do disco se existir
        if (produto.foto) {
          const caminhoFoto = path.join(__dirname, "..", "uploads", produto.foto);
          if (fs.existsSync(caminhoFoto)) {
            fs.unlinkSync(caminhoFoto);
          }
        }

    // Deleta o histórico de movimentações
    await knex("estoque_movimentacoes").where({ produto_id: id, empresa_id: empresaId }).del();
    // Deleta o produto
    await knex("produtos").where({ id, empresa_id: empresaId }).del();

    res.json({ mensagem: "🗑️ Produto excluído com sucesso!" });
  } catch (error) {
    console.error("Erro ao excluir produto:", error);
    res.status(500).json({ erro: "Erro ao excluir produto." });
  }
});

// Histórico de alterações de produto
router.get("/:id/historico", autenticacao, async (req, res) => {
  try {
    const { empresaId } = req;
    const { id } = req.params;

    const historico = await knex("produtos_historico as h")
      .select(
        "h.id",
        "h.campo_alterado",
        "h.valor_antigo",
        "h.valor_novo",
        "h.data_alteracao",
        "u.nome as usuario_nome"
      )
      .leftJoin("usuarios as u", "h.usuario_id", "u.id")
      .where({ produto_id: id, empresa_id: empresaId })
      .orderBy("h.data_alteracao", "desc");

    res.json(historico);
  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    res.status(500).json({ erro: "Erro ao buscar histórico de alterações." });
  }
});

module.exports = router;