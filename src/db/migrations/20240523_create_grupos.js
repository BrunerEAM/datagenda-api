exports.up = function (knex) {
  return knex.schema.createTable("grupos", function (table) {
    table.increments("id").primary();
    table.integer("empresa_id").notNullable()
      .references("id").inTable("empresa")
      .onDelete("CASCADE");

    table.string("nome").notNullable();
    table.string("descricao");
    table.enu("tipo", ["produto", "servico", "ambos"]).notNullable();

    table.integer("grupo_pai_id")
      .unsigned()
      .references("id")
      .inTable("grupos")
      .onDelete("SET NULL");

    table.enu("status", ["ativo", "inativo"]).defaultTo("ativo");

    // Auditoria
    table.integer("usuario_criacao_id")
      .references("id")
      .inTable("usuarios")
      .onDelete("SET NULL");

    table.integer("atualizado_por")
      .references("id")
      .inTable("usuarios")
      .onDelete("SET NULL");

    table.timestamp("data_cadastro").defaultTo(knex.fn.now());
    table.timestamp("data_atualizacao").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("grupos");
};
