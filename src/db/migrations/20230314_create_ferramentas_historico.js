exports.up = function (knex) {
  return knex.schema.createTable("ferramentas_historico", function (table) {
    table.increments("id").primary();

table.integer("ferramenta_id").notNullable()
  .references("id")
  .inTable("ferramentas")
  .onDelete("CASCADE");
    
  table.integer("empresa_id").notNullable()
  .references("id")
  .inTable("empresa")
  .onDelete("CASCADE");

  table.integer("usuario_id")
  .references("id")
  .inTable("usuarios")
  .onDelete("SET NULL");

    table.string("campo_alterado").notNullable();
    table.string("valor_antigo", 1000);
    table.string("valor_novo", 1000);

    table.timestamp("data_alteracao").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("ferramentas_historico");
};