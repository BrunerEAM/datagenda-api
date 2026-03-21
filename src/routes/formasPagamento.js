// formasPagamento.js
const express = require("express");
const router = express.Router();
const knex = require("../db/connection");
const autenticacao = require("../middlewares/autenticacao");

// Função auxiliar para registrar alterações (reutilizada do servicos.js, adaptada)
async function registrarHistoricoAlteracao(
  knexInstance,
  formaPagamentoId,
  empresaId,
  usuarioId,
  campo,
  valorAntigo,
  valorNovo
) {
  const oldVal = valorAntigo !== undefined && valorAntigo !== null ? JSON.stringify(valorAntigo) : null;
  const newVal = valorNovo !== undefined && valorNovo !== null ? JSON.stringify(valorNovo) : null;

  await knexInstance("forma_pagamento_historico_alteracoes").insert({
    forma_pagamento_id: formaPagamentoId,
    empresa_id: empresaId,
    campo_alterado: campo,
    valor_antigo: oldVal,
    valor_novo: newVal,
    data_alteracao: knexInstance.fn.now(),
    usuario_alteracao_id: usuarioId,
  });
}

// ✅ Listar formas de pagamento
router.get("/", autenticacao, async (req, res) => {
  const { empresaId } = req;
  const { pesquisa, status, tipo } = req.query; // Filtros

  try {
    let query = knex("formas_pagamento")
      .where("empresa_id", empresaId)
      .select('*');

    if (pesquisa) {
      query.andWhere(function () {
        this.where("nome", "ilike", `%${pesquisa}%`).orWhere(
          "descricao",
          "ilike",
          `%${pesquisa}%`
        );
      });
    }

    if (status && status !== "todos") {
      query.andWhere("status", status);
    }

    if (tipo && tipo !== "todos") {
      query.andWhere("tipo", tipo);
    }

    const resultados = await query.orderBy("ordem_exibicao", "asc").orderBy("nome", "asc");
    res.json(resultados);
  } catch (error) {
    console.error("Erro ao buscar formas de pagamento:", error);
    res.status(500).json({ erro: "Erro ao buscar formas de pagamento." });
  }
});

// ✅ Criar forma de pagamento
router.post("/", autenticacao, async (req, res) => {
  const { empresaId, userId } = req;
  const {
    nome,
    tipo,
    descricao,
    status,
    requer_parcelamento,
    permite_troco,
    taxa_percentual,
    taxa_fixa,
    prazo_recebimento_dias,
    observacoes_internas,
    ordem_exibicao,
    icone,
  } = req.body;

  try {
    if (!nome || !tipo) {
      return res.status(400).json({ erro: "Nome e Tipo são obrigatórios." });
    }

    // Converter booleanos de string para boolean
    const finalRequerParcelamento = requer_parcelamento === true || requer_parcelamento === 'true';
    const finalPermiteTroco = permite_troco === true || permite_troco === 'true';

    // Conversão de números
    const finalTaxaPercentual = taxa_percentual ? parseFloat(taxa_percentual) : 0;
    const finalTaxaFixa = taxa_fixa ? parseFloat(taxa_fixa) : 0;
    const finalPrazoRecebimentoDias = prazo_recebimento_dias ? parseInt(prazo_recebimento_dias, 10) : 0;
    const finalOrdemExibicao = ordem_exibicao ? parseInt(ordem_exibicao, 10) : null;


    const [formaPagamentoId] = await knex("formas_pagamento").insert({
      empresa_id: empresaId,
      nome,
      tipo,
      descricao,
      status: status || 'ativo',
      requer_parcelamento: finalRequerParcelamento,
      permite_troco: finalPermiteTroco,
      taxa_percentual: finalTaxaPercentual,
      taxa_fixa: finalTaxaFixa,
      prazo_recebimento_dias: finalPrazoRecebimentoDias,
      observacoes_internas,
      ordem_exibicao: finalOrdemExibicao,
      icone,
      usuario_criacao_id: userId,
      data_cadastro: knex.fn.now(),
      data_atualizacao: knex.fn.now(),
    }, 'id');

    res.status(201).json({ mensagem: "✅ Forma de pagamento cadastrada com sucesso!", id: formaPagamentoId });
  } catch (error) {
    if (error.code === '23505') { // Código de erro para violação de unique constraint (nome duplicado)
      return res.status(409).json({ erro: "Já existe uma forma de pagamento com este nome para sua empresa." });
    }
    console.error("Erro ao cadastrar forma de pagamento:", error);
    res.status(500).json({ erro: "Erro ao cadastrar forma de pagamento.", detalhes: error.message });
  }
});

// ✅ Atualizar forma de pagamento
router.put("/:id", autenticacao, async (req, res) => {
  const { empresaId, userId } = req;
  const { id } = req.params;
  const {
    nome,
    tipo,
    descricao,
    status,
    requer_parcelamento,
    permite_troco,
    taxa_percentual,
    taxa_fixa,
    prazo_recebimento_dias,
    observacoes_internas,
    ordem_exibicao,
    icone,
  } = req.body;

  try {
    const formaPagamentoExistente = await knex("formas_pagamento")
      .where({ id, empresa_id: empresaId })
      .first();

    if (!formaPagamentoExistente) {
      return res.status(404).json({ erro: "Forma de pagamento não encontrada." });
    }

    if (!nome || !tipo) {
      return res.status(400).json({ erro: "Nome e Tipo são obrigatórios." });
    }

    // Converter booleanos de string para boolean
    const finalRequerParcelamento = requer_parcelamento === true || requer_parcelamento === 'true';
    const finalPermiteTroco = permite_troco === true || permite_troco === 'true';

    // Conversão de números
    const finalTaxaPercentual = taxa_percentual ? parseFloat(taxa_percentual) : 0;
    const finalTaxaFixa = taxa_fixa ? parseFloat(taxa_fixa) : 0;
    const finalPrazoRecebimentoDias = prazo_recebimento_dias ? parseInt(prazo_recebimento_dias, 10) : 0;
    const finalOrdemExibicao = ordem_exibicao ? parseInt(ordem_exibicao, 10) : null;


    const dadosAtualizados = {
      nome,
      tipo,
      descricao,
      status: status || 'ativo',
      requer_parcelamento: finalRequerParcelamento,
      permite_troco: finalPermiteTroco,
      taxa_percentual: finalTaxaPercentual,
      taxa_fixa: finalTaxaFixa,
      prazo_recebimento_dias: finalPrazoRecebimentoDias,
      observacoes_internas,
      ordem_exibicao: finalOrdemExibicao,
      icone,
      usuario_atualizacao_id: userId,
      data_atualizacao: knex.fn.now(),
    };

    // Registrar histórico de alterações
    for (const key in dadosAtualizados) {
        if (['usuario_atualizacao_id', 'data_atualizacao'].includes(key)) {
            continue;
        }

        let oldValue = formaPagamentoExistente[key];
        let newValue = dadosAtualizados[key];

        // Normaliza booleanos para comparação (0/1 do DB vs true/false)
        if (typeof oldValue === 'number' && (oldValue === 0 || oldValue === 1)) oldValue = !!oldValue;
        if (typeof newValue === 'number' && (newValue === 0 || newValue === 1)) newValue = !!newValue;

        if (String(oldValue) !== String(newValue)) {
            await registrarHistoricoAlteracao(
                knex,
                id,
                empresaId,
                userId,
                key,
                formaPagamentoExistente[key],
                dadosAtualizados[key]
            );
        }
    }

    await knex("formas_pagamento")
      .where({ id, empresa_id: empresaId })
      .update(dadosAtualizados);

    res.json({ mensagem: "✅ Forma de pagamento atualizada com sucesso!" });
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
        return res.status(409).json({ erro: "Já existe uma forma de pagamento com este nome para sua empresa." });
    }
    console.error("Erro ao atualizar forma de pagamento:", error);
    res.status(500).json({ erro: "Erro ao atualizar forma de pagamento.", detalhes: error.message });
  }
});

// ✅ Excluir forma de pagamento
router.delete("/:id", autenticacao, async (req, res) => {
  const { empresaId } = req;
  const { id } = req.params;

  try {
    const formaPagamento = await knex("formas_pagamento")
      .where({ id, empresa_id: empresaId })
      .first();

    if (!formaPagamento) {
      return res.status(404).json({ erro: "Forma de pagamento não encontrada." });
    }

    // Opcional: Verificar dependências antes de excluir (ex: se está sendo usada em vendas)
    // Se a forma de pagamento estiver associada a registros em outras tabelas (vendas, caixa, etc.),
    // considere marcar como 'inativo' em vez de excluir, ou implementar uma lógica de verificação.
    // Exemplo:
    // const countVendas = await knex('vendas').where('forma_pagamento_id', id).count('id as count').first();
    // if (countVendas.count > 0) {
    //   return res.status(400).json({ erro: "Esta forma de pagamento não pode ser excluída, pois está associada a vendas existentes." });
    // }

    // Deletar histórico primeiro (devido ao CASCADE na FK da forma_pagamento)
    await knex("forma_pagamento_historico_alteracoes").where("forma_pagamento_id", id).del();

    await knex("formas_pagamento").where({ id, empresa_id: empresaId }).del();

    res.json({ mensagem: "🗑️ Forma de pagamento excluída com sucesso!" });
  } catch (error) {
    console.error("Erro ao excluir forma de pagamento:", error);
    res.status(500).json({ erro: "Erro ao excluir forma de pagamento." });
  }
});

module.exports = router;