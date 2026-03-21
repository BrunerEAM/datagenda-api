// ✅ Migration: estoque_auditoria

exports.up = function (knex) {
  return knex.schema.createTable("estoque_auditoria", function (table) {
    table.increments("id").primary();
    table.integer("movimentacao_id").unsigned().notNullable().references("id").inTable("estoque_movimentacoes").onDelete("CASCADE");
    table.integer("produto_id").unsigned().notNullable().references("id").inTable("produtos").onDelete("CASCADE");
    table.integer("usuario_id").unsigned().references("id").inTable("usuarios").onDelete("SET NULL");
    table.timestamp("data").defaultTo(knex.fn.now());
    table.enu("tipo", ["entrada", "saida", "ajuste+", "ajuste-"]).notNullable();
    table.decimal("quantidade", 10, 2).notNullable();
    table.decimal("estoque_antes", 10, 2).notNullable();
    table.decimal("estoque_depois", 10, 2).notNullable();
    table.text("justificativa").notNullable();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("estoque_auditoria");
};
