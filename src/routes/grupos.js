const express = require("express");
const router = express.Router();
const knex = require("../db/connection");
const autenticacao = require("../middlewares/autenticacao");

// ✅ Listar grupos
// ✅ Listar grupos (busca que traz pais e filhos dos itens que batem)
router.get("/", autenticacao, async (req, res) => {
  try {
    const { empresaId } = req;
    const { pesquisa, status, data_inicio, data_fim } = req.query;

    // WHERE dinâmico para a base "matched"
    const where = ["g.empresa_id = ?"];
    const params = [empresaId];

    if (status === "ativos") where.push("g.status = 'ativo'");
    else if (status === "inativos") where.push("g.status = 'inativo'");

    if (data_inicio) { where.push("g.data_cadastro >= ?"); params.push(data_inicio); }
    if (data_fim)    { where.push("g.data_cadastro <= ?"); params.push(data_fim); }

    if (pesquisa) {
      where.push("(g.nome ILIKE ? OR g.descricao ILIKE ?)");
      params.push(`%${pesquisa}%`, `%${pesquisa}%`);
    }

    const sql = `
      WITH RECURSIVE matched AS (
        SELECT g.*
        FROM grupos g
        WHERE ${where.join(" AND ")}
      ),
      ancestors AS (
        SELECT m.*
        FROM matched m
        UNION
        SELECT gp.*
        FROM grupos gp
        JOIN ancestors a ON a.grupo_pai_id = gp.id
        WHERE gp.empresa_id = ?
        ${status === "ativos" ? "AND gp.status = 'ativo'" : status === "inativos" ? "AND gp.status = 'inativo'" : ""}
      ),
      descendants AS (
        SELECT m.*
        FROM matched m
        UNION
        SELECT gc.*
        FROM grupos gc
        JOIN descendants d ON gc.grupo_pai_id = d.id
        WHERE gc.empresa_id = ?
        ${status === "ativos" ? "AND gc.status = 'ativo'" : status === "inativos" ? "AND gc.status = 'inativo'" : ""}
      ),
      unioned AS (
        SELECT * FROM ancestors
        UNION
        SELECT * FROM descendants
      )
      SELECT u.*, gp.nome AS grupo_pai_nome
      FROM unioned u
      LEFT JOIN grupos gp
        ON gp.id = u.grupo_pai_id AND gp.empresa_id = ?
      ORDER BY u.nome ASC
    `;

    const finalParams = [...params, empresaId, empresaId, empresaId];
    const { rows } = await knex.raw(sql, finalParams);
    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar grupos:", error);
    res.status(500).json({ erro: "Erro ao buscar grupos." });
  }
});


// ✅ Criar grupo
router.post("/", autenticacao, async (req, res) => {
  try {
    const { empresaId, userId } = req;
    const { nome, descricao, tipo, status, grupo_pai_id } = req.body;

    if (!nome) {
      return res.status(400).json({ erro: "O nome é obrigatório." });
    }

    if (!["produto", "servico", "ambos"].includes(tipo)) {
      return res.status(400).json({ erro: "Tipo inválido." });
    }

    if (status && !["ativo", "inativo"].includes(status)) {
      return res.status(400).json({ erro: "Status inválido." });
    }

    // Verificar se grupo_pai_id pertence à mesma empresa (se informado)
    if (grupo_pai_id) {
      const grupoPai = await knex("grupos")
        .where({ id: grupo_pai_id, empresa_id: empresaId })
        .first();
      if (!grupoPai) {
        return res.status(400).json({ erro: "Grupo pai não encontrado." });
      }
    }

    await knex("grupos").insert({
      nome,
      descricao,
      tipo,
      status: status || "ativo",
      grupo_pai_id: grupo_pai_id || null,
      empresa_id: empresaId,
      usuario_criacao_id: userId,
      data_cadastro: knex.fn.now(),
      data_atualizacao: knex.fn.now(),
    });

    res.status(201).json({ mensagem: "✅ Grupo cadastrado com sucesso!" });
  } catch (error) {
    console.error("Erro ao cadastrar grupo:", error);
    res.status(500).json({ erro: "Erro ao cadastrar grupo." });
  }
});

// ✅ Atualizar grupo
router.put("/:id", autenticacao, async (req, res) => {
  try {
    const { id } = req.params;
    const { empresaId, userId } = req;
    const { nome, descricao, tipo, status, grupo_pai_id } = req.body;

    const grupoExiste = await knex("grupos")
      .where({ id, empresa_id: empresaId })
      .first();

    if (!grupoExiste) {
      return res.status(404).json({ erro: "Grupo não encontrado." });
    }

    if (!nome) {
      return res.status(400).json({ erro: "O nome é obrigatório." });
    }

    if (!["produto", "servico", "ambos"].includes(tipo)) {
      return res.status(400).json({ erro: "Tipo inválido." });
    }

    if (status && !["ativo", "inativo"].includes(status)) {
      return res.status(400).json({ erro: "Status inválido." });
    }

    // Verificar se grupo_pai_id é válido e da mesma empresa
    if (grupo_pai_id) {
      const grupoPai = await knex("grupos")
        .where({ id: grupo_pai_id, empresa_id: empresaId })
        .first();
      if (!grupoPai) {
        return res.status(400).json({ erro: "Grupo pai não encontrado." });
      }

      // Impedir que o grupo seja pai dele mesmo
      if (parseInt(grupo_pai_id) === parseInt(id)) {
        return res.status(400).json({ erro: "O grupo não pode ser pai dele mesmo." });
      }
    }

    await knex("grupos")
      .where({ id, empresa_id: empresaId })
      .update({
        nome,
        descricao,
        tipo,
        status,
        grupo_pai_id: grupo_pai_id || null,
        atualizado_por: userId,
        data_atualizacao: knex.fn.now(),
      });

    res.json({ mensagem: "✅ Grupo atualizado com sucesso!" });
  } catch (error) {
    console.error("Erro ao atualizar grupo:", error);
    res.status(500).json({ erro: "Erro ao atualizar grupo." });
  }
});

// ✅ Excluir grupo
router.delete("/:id", autenticacao, async (req, res) => {
  try {
    const { id } = req.params;
    const { empresaId } = req;

    const grupo = await knex("grupos")
      .where({ id, empresa_id: empresaId })
      .first();

    if (!grupo) {
      return res.status(404).json({ erro: "Grupo não encontrado." });
    }

    const subgrupo = await knex("grupos")
      .where({ grupo_pai_id: id, empresa_id: empresaId })
      .first();

    if (subgrupo) {
      return res.status(400).json({
        erro: "❌ Não é possível excluir. Este grupo possui subgrupos vinculados.",
      });
    }

    await knex("grupos")
      .where({ id, empresa_id: empresaId })
      .del();

    res.json({ mensagem: "🗑️ Grupo excluído com sucesso!" });
  } catch (error) {
    console.error("Erro ao excluir grupo:", error);
    res.status(500).json({ erro: "Erro ao excluir grupo." });
  }
});

module.exports = router;
