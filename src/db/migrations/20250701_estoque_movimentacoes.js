exports.up = function (knex) {
  return knex.schema.createTable("estoque_movimentacoes", function (table) {
    table.increments("id").primary();
    table
      .integer("empresa_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("empresa")
      .onDelete("CASCADE");
    table
      .integer("produto_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("produtos")
      .onDelete("CASCADE");
    table
      .enu("tipo", ["entrada", "saida", "ajuste+", "ajuste-"])
      .notNullable();
    table.decimal("quantidade", 10, 2).notNullable();
    table.decimal("estoque_antes", 10, 2).notNullable();
    table.decimal("estoque_depois", 10, 2).notNullable();
    table
      .timestamp("data_movimentacao")
      .defaultTo(knex.fn.now())
      .notNullable();
    table
      .integer("usuario_id")
      .unsigned()
      .references("id")
      .inTable("usuarios")
      .onDelete("SET NULL");
    table.text("observacao").notNullable();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("estoque_movimentacoes");
};
