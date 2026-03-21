


const express = require("express");
const router = express.Router();
const knex = require("../db/connection");
const autenticacao = require("../middlewares/autenticacao");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });



router.get("/", autenticacao,   async (req, res) => {
  try {

  
    const { empresaId } = req;

    const ferramentas = await knex("ferramentas")
      .where({ empresa_id: empresaId })
      .orderBy("nome", "asc");

    res.json({ data: ferramentas });

  } catch (error) {

    console.error("Erro ao buscar ferramentas:", error);

    res.status(500).json({
      erro: "Erro ao buscar ferramentas."
    });

  }
});


// ✅ Cadastrar ferramenta
router.post("/", autenticacao, upload.single("foto"), async (req, res) => {

  //console.log("BODY:", req.body); verificar dados recebidos
  //console.log("FILE:", req.file);

  try {

    const { empresaId, userId } = req;
    const dados = req.body;

    console.log("Dados da ferramenta:", dados);
    //const nomeProvisorio = `Ferramenta ${Date.now()}`;

    const [id] = await knex("ferramentas").insert({

      empresa_id: empresaId,
      nome: dados.nome || null,
      descricao: dados.descricao || null,
      marca: dados.marca || null,
      modelo: dados.modelo || null,
      numero_serie: dados.numero_serie || null,
      data_aquisicao: dados.data_aquisicao || null,
      valor_aquisicao: dados.valor_aquisicao || 0,
      status: dados.status || "ativa",
      //responsavel_id: dados.responsavel_id || null,
      observacoes: dados.observacoes || null,
      usuario_criacao_id: userId,
      //usuario_atualizacao_id: userId,
      data_cadastro: knex.fn.now(),
      data_atualizacao: knex.fn.now()

    }, ["id"]);

    res.status(201).json({
      mensagem: "Ferramenta cadastrada com sucesso!",
      id: id.id || id
    });

  } catch (error) {

    console.error("Erro ao cadastrar ferramenta:", error);

    res.status(500).json({
      erro: "Erro ao cadastrar ferramenta."
    });

  }

});

router.put("/:id", autenticacao, upload.single("foto"), async (req, res) => {

  try {

    const { empresaId, userId } = req;
    const { id } = req.params;

    const dados = req.body;

    const ferramenta = await knex("ferramentas")
      .where({ id, empresa_id: empresaId })
      .first();

    if (!ferramenta) {

      return res.status(404).json({
        erro: "Ferramenta não encontrada."
      });

    }

    const dadosAtualizados = {

      nome: dados.nome || null,
      descricao: dados.descricao || null,
      marca: dados.marca || null,
      modelo: dados.modelo || null,
      numero_serie: dados.numero_serie || null,
      data_aquisicao: dados.data_aquisicao || null,
      valor_aquisicao: dados.valor_aquisicao || 0,
      status: dados.status || "Ativa",
      //responsavel_id: dados.responsavel_id || null,
      observacoes: dados.observacoes || null,
      usuario_atualizacao_id: userId,
      data_atualizacao: knex.fn.now()
    };

    await knex("ferramentas")
      .where({ id, empresa_id: empresaId })
      .update(dadosAtualizados);

    // auditoria

    for (const campo in dadosAtualizados) {

      const novoValor = dadosAtualizados[campo];
      const antigoValor = ferramenta[campo];

      if (`${novoValor}` !== `${antigoValor}`) {

        await knex("ferramentas_historico").insert({

          ferramenta_id: id,
          empresa_id: empresaId,
          usuario_id: userId,
          campo_alterado: campo,
          valor_antigo: antigoValor,
          valor_novo: novoValor,
          data_alteracao: knex.fn.now()

        });

      }

    }

    res.json({
      mensagem: "Ferramenta atualizada com sucesso!"
    });

  } catch (error) {

    console.error("Erro ao atualizar ferramenta:", error);

    res.status(500).json({
      erro: "Erro ao atualizar ferramenta."
    });

  }

});

router.delete("/:id", autenticacao, async (req, res) => {

  try {

    const { empresaId } = req;
    const { id } = req.params;

    const ferramenta = await knex("ferramentas")
      .where({ id, empresa_id: empresaId })
      .first();

    if (!ferramenta) {

      return res.status(404).json({
        erro: "Ferramenta não encontrada."
      });

    }

    await knex("ferramentas")
      .where({ id, empresa_id: empresaId })
      .del();

    res.json({
      mensagem: "Ferramenta excluída com sucesso!"
    });

  } catch (error) {

    console.error("Erro ao excluir ferramenta:", error);

    res.status(500).json({
      erro: "Erro ao excluir ferramenta."
    });

  }

});

module.exports = router;