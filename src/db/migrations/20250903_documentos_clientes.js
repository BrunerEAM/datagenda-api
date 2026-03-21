exports.up = function (knex) {
  return knex.schema.createTable("documentos_clientes", function (table) {
    table.increments("id").primary();

    // Relacionamentos
    table
      .integer("documento_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("documentos")
      .onDelete("CASCADE");

    table
      .integer("cliente_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("clientes")
      .onDelete("CASCADE");

    // UUID único para link público
    table
      .uuid("link_uuid")
      .notNullable()
      .defaultTo(knex.raw("gen_random_uuid()"));

    // Status do documento enviado
    table
      .enu("status", ["pendente", "assinado", "revogado"], {
        useNative: true,
        enumName: "documentos_clientes_status_enum",
      })
      .notNullable()
      .defaultTo("pendente");

    // Respostas do cliente (JSON)
    table.jsonb("respostas").defaultTo("{}");

    // Assinatura em base64 (imagem)
    table.text("assinatura");

    // Datas de controle
    table.timestamps(true, true); // created_at e updated_at
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("documentos_clientes");
};
