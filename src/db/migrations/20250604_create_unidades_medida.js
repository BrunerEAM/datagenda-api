exports.up = function (knex) {
  return knex.schema.createTable("unidades_medida", (table) => {
    table.increments("id").primary();
    table.integer("empresa_id").notNullable()
      .references("id").inTable("empresa")
      .onDelete("CASCADE");

    table.string("nome").notNullable();    // Ex.: Metro, Quilograma, Unidade
    table.string("sigla", 10).notNullable(); // Ex.: m, kg, un, cx, lt
    table.string("status").defaultTo("ativo"); // ativo ou inativo

    // Auditoria
    table.integer("usuario_criacao_id")
      .references("id").inTable("usuarios")
      .onDelete("SET NULL");
    table.integer("atualizado_por")
      .references("id").inTable("usuarios")
      .onDelete("SET NULL");

    table.timestamp("data_cadastro").defaultTo(knex.fn.now());
    table.timestamp("data_atualizacao").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("unidades_medida");
};
