// ✅ servicos.js - Backend dos Serviços (corrigido)

const express = require("express");
const router = express.Router();
const knex = require("../db/connection");
const autenticacao = require("../middlewares/autenticacao");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configuração do upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const empresaId = req.empresaId;
    const dir = `./uploads/${req.empresaId}/servicos`;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `servico_${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });



// ✅ Listar serviços com filtros e paginação
router.get("/", autenticacao, async (req, res) => {
  try {
    const { empresaId } = req;
    const { grupo_id, busca, status, page = 1, limit = 10 } = req.query;

    const pageInt = parseInt(page, 10) || 1;
    const limitInt = parseInt(limit, 10) || 10;
    const offset = (pageInt - 1) * limitInt;

    // 1. Query base
    let queryBase = knex("servicos").where({ empresa_id: empresaId });

    // 2. Aplicar filtros
    if (grupo_id) queryBase.andWhere("grupo_id", grupo_id);

    if (busca) {
      queryBase.andWhere(function () {
        this.where("nome", "ilike", `%${busca}%`)
            .orWhere("descricao", "ilike", `%${busca}%`);
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
    const servicos = await queryBase
      .clone()
      .orderBy("nome", "asc")
      .limit(limitInt)
      .offset(offset);

    // 5. Resposta formatada
    res.json({
      data: servicos,
      total: total,
      per_page: limitInt,
      current_page: pageInt,
      last_page: Math.ceil(total / limitInt),
    });
  } catch (error) {
    console.error("Erro ao listar servicos:", error);
    res.status(500).json({ erro: "Erro ao listar servicos." });
  }
});



// ✅ Criar produto
router.post("/", autenticacao, upload.single("foto"), async (req, res) => {
  try {
    const dados = req.body;
   const foto = req.file ? `${req.empresaId}/servicos/${req.file.filename}` : null;
    

    const preco = parseFloat(dados.preco_venda) || 0;
    const custo = parseFloat(dados.custo) || 0;
    const liquido = parseFloat(dados.valor_liquido) || preco - custo;
    const lucro = parseFloat(dados.percentual_lucro) || (custo > 0 ? ((preco - custo) / custo) * 100 : 0);

   const [{ id }] = await knex("servicos").insert({
  nome: dados.nome,
  descricao: dados.descricao || null,
  preco_venda: preco,
  custo: custo,
  percentual_lucro: lucro,
  valor_liquido: liquido,
  grupo_id: dados.grupo_id || null,
  cor_agenda: dados.cor_agenda || "#2196f3",
  exige_sala: dados.exige_sala === "true",
  sala_id: dados.sala_id || null,
  status: dados.status || "ativo",
  previsao_retorno: parseInt(dados.previsao_retorno) || 0,
  agendamento_online: dados.agendamento_online === "true",
  controla_pacote: dados.controla_pacote === "true",
  quantidade_sessoes: dados.quantidade_sessoes || null,
  foto,
  empresa_id: req.empresaId,
  usuario_criacao_id: req.userId,
  usuario_atualizacao_id: req.userId,
  data_cadastro: knex.fn.now(),
  data_atualizacao: knex.fn.now(),
}, ["id"]);

    res.status(201).json({ mensagem: "Serviço criado com sucesso!", id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao criar serviço." });
  }
});

// backend/routes/servicos.js
router.put("/:id", autenticacao, upload.single("foto"), async (req, res) => {
  try {
    const { empresaId, userId } = req;
    const { id } = req.params;
    const dados = req.body;
    const foto = req.file ? `${req.empresaId}/${req.file.filename}` : null;

    const preco = parseFloat(dados.preco_venda) || 0;
    const custo = parseFloat(dados.custo) || 0;
    const liquido = parseFloat(dados.valor_liquido) || preco - custo;
    const lucro = parseFloat(dados.percentual_lucro) || (custo > 0 ? ((preco - custo) / custo) * 100 : 0);

    const servico = await knex("servicos")
      .where({ id, empresa_id: req.empresaId })
      .first();

    if (!servico) return res.status(404).json({ erro: "Serviço não encontrado." });

  
      // Verifica se o produto existe dentro da empresa
    const novaFoto = req.file ? `${req.empresaId}/servicos/${req.file.filename}` : servico.foto; // Nova foto

    // ⚠️ Se enviou nova foto, remover a anterior
if (req.file && servico.foto && servico.foto !== novaFoto) {
  const caminhoAntigo = path.join(__dirname, "..", "uploads", servico.foto);
  if (fs.existsSync(caminhoAntigo)) {
    fs.unlinkSync(caminhoAntigo);
  }
}

    // atualização dos dados do serviço
    const atualizacao = {
      nome: dados.nome,
      descricao: dados.descricao || null,
      preco_venda: preco,
      custo: custo,
      percentual_lucro: lucro,
      valor_liquido: liquido,
      grupo_id: dados.grupo_id || null,
      cor_agenda: dados.cor_agenda || "#2196f3",
      exige_sala: dados.exige_sala === "true",
      sala_id: dados.sala_id || null,
      status: dados.status || "ativo",
      previsao_retorno: parseInt(dados.previsao_retorno) || 0,
      agendamento_online: dados.agendamento_online === "true",
      controla_pacote: dados.controla_pacote === "true",
      quantidade_sessoes: dados.quantidade_sessoes || null,
      foto: novaFoto,
      usuario_atualizacao_id: req.userId,
      data_atualizacao: knex.fn.now(),
    };

    // Salva no banco
    await knex("servicos").where({ id, empresa_id: req.empresaId }).update(atualizacao);


     // Auditoria - Compara e grava histórico de alterações
        for (const campo in atualizacao) {
          const novoValor = atualizacao[campo];
          const antigoValor = servico[campo];
    
          if (`${novoValor}` !== `${antigoValor}`) {
            await knex("servicos_historico").insert({
              servico_id: id,
              empresa_id: empresaId,
              usuario_id: userId,
              campo_alterado: campo,
              valor_antigo: antigoValor,
              valor_novo: novoValor,
              data_alteracao: knex.fn.now(),
            });
          }
        }

    res.json({ mensagem: "Serviço atualizado com sucesso!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao atualizar serviço." });
  }
});

//excluir servico
router.delete("/:id", autenticacao, async (req, res) => {
  try {
    const { id } = req.params;

    const servico = await knex("servicos")
      .where({ id, empresa_id: req.empresaId })
      .first();

    if (!servico) return res.status(404).json({ erro: "Serviço não encontrado." });

    // ⚠️ Remover imagem do disco se existir
    if (servico.foto) {
      const caminhoFoto = path.join(__dirname, "..", "uploads", servico.foto);
      if (fs.existsSync(caminhoFoto)) {
        fs.unlinkSync(caminhoFoto);
      }
    }

    await knex("servicos")
      .where({ id, empresa_id: req.empresaId })
      .delete();

    res.json({ mensagem: "Serviço excluído com sucesso!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao excluir serviço." });
  }
});
module.exports = router;