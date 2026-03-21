exports.up = function(knex) {
  return knex.schema.createTable("salas", function(table) {
    table.increments("id").primary();
    table.integer("empresa_id").unsigned().notNullable().references("id").inTable("empresa").onDelete("CASCADE");
    table.string("nome").notNullable();
    table.string("descricao");
    table.boolean("permite_dois_agendamentos").defaultTo(false);
    table.enum("status", ["ativo", "inativo"]).defaultTo("ativo");
    table.timestamp("data_cadastro").defaultTo(knex.fn.now());
    table.timestamp("data_atualizacao").defaultTo(knex.fn.now());
    table.integer("usuario_criacao_id").unsigned().references("id").inTable("usuarios");
    table.integer("atualizado_por").unsigned().references("id").inTable("usuarios");
    table.integer("usuario_atualizacao_id").unsigned().references("id").inTable("usuarios");


    // Auditoria futura se desejar:
    // table.timestamp("ultima_alteracao");
    // table.integer("usuario_alteracao_id").references("id").inTable("usuarios");
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable("salas");
};
