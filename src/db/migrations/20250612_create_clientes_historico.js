// migrations/20250612_create_produtos_historico.js

exports.up = function(knex) {
  return knex.schema.createTable("clientes_historico", function(table) {
    table.increments("id").primary();
    table.integer("cliente_id").unsigned().notNullable().references("id").inTable("clientes").onDelete("CASCADE");
    table.integer("empresa_id").unsigned().notNullable().references("id").inTable("empresa").onDelete("CASCADE");
    table.integer("usuario_id").unsigned().references("id").inTable("usuarios").onDelete("SET NULL");
    
    table.string("campo_alterado").notNullable();
    table.string("valor_antigo", 1000);
    table.string("valor_novo", 1000);

    table.timestamp("data_alteracao").defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable("clientes_historico");
};
