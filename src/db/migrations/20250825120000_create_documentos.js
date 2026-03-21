exports.up = function (knex) {
  return knex.schema.createTable("documentos", function (table) {
    table.increments("id").primary();
    table
      .integer("empresa_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("empresa")
      .onDelete("CASCADE");

    table.string("nome").notNullable(); // Nome do documento
    table.jsonb("estrutura_json").notNullable().defaultTo("[]"); // Estrutura do formulário (ReactFormBuilder)

    table
      .enu("status", ["ativo", "inativo"], {
        useNative: true,
        enumName: "documentos_status_enum",
      })
      .notNullable()
      .defaultTo("ativo");

    table.timestamps(true, true); // created_at e updated_at
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("documentos");
};
