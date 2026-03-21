exports.up = function (knex) {
  return knex.schema.createTable("ferramentas", function (table) {
    table.increments("id").primary();

    table.integer("empresa_id").notNullable()
      .references("id")
      .inTable("empresa")
      .onDelete("CASCADE");

    table.string("nome").notNullable();
    table.text("descricao");
    table.string("numero_serie");
    table.string("marca");
    table.string("modelo");

    table.date("data_aquisicao");
    table.date("data_atualizacao");
    table.date("data_cadastro");
    table.decimal("valor_aquisicao", 14, 2);

    table.enu("status", ["ativa", "manutencao", "inativa"])
      .defaultTo("ativa");

    table.integer("responsavel_id")
      .references("id")
      .inTable("usuarios")
      .onDelete("SET NULL");

      table.integer("usuario_atualizacao_id")
      .references("id")
      .inTable("usuarios")
      .onDelete("SET NULL");

      table.integer("usuario_criacao_id")
      .references("id")
      .inTable("usuarios")
      .onDelete("SET NULL");

    table.text("observacoes");

    table.timestamp("deleted_at").nullable(); // Soft delete

    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("ferramentas");
};