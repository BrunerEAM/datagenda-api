// migrations/YYYYMMDD_create_servicos_historico.js

exports.up = function(knex) {
  return knex.schema.createTable("servicos_historico", function(table) {
    table.increments("id").primary();
    table.integer("servico_id").unsigned().notNullable().references("id").inTable("servicos").onDelete("CASCADE");
    table.integer("empresa_id").unsigned().notNullable().references("id").inTable("empresa").onDelete("CASCADE");
    table.integer("usuario_id").unsigned().references("id").inTable("usuarios").onDelete("SET NULL");
    
    table.string("campo_alterado").notNullable();
    table.string("valor_antigo", 1000);
    table.string("valor_novo", 1000);

    table.timestamp("data_alteracao").defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable("servicos_historico");
};
