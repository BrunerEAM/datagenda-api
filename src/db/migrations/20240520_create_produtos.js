// migrations/20250612_create_produtos.js

exports.up = function(knex) {
  return knex.schema.createTable("produtos", function(table) {
    table.increments("id").primary();
    table.integer("empresa_id").unsigned().notNullable().references("id").inTable("empresa").onDelete("CASCADE");

    // Campos principais do produto
    table.string("codigo_sku").unique();
    table.string("nome").notNullable();
    table.text("descricao");
    table.decimal("preco_venda", 12, 2).notNullable();
    table.decimal("custo", 12, 2);
    table.decimal("percentual_lucro", 7, 2);
    table.decimal("valor_liquido", 12, 2);
    table.integer("grupo_id").unsigned().references("id").inTable("grupos").onDelete("SET NULL");
    table.integer("unidade_id").unsigned().references("id").inTable("unidades_medida").onDelete("SET NULL");
    table.enum("status", ["ativo", "inativo"]).defaultTo("ativo");

    // Controle de estoque
    table.boolean("controla_estoque").defaultTo(false);
    table.integer("estoque_minimo").defaultTo(0);
    table.integer("estoque_atual").defaultTo(0);
    table.string("codigo_barras_qr");

    // Upload de imagem
    table.string("foto");

    // Auditoria
    table.timestamp("data_cadastro").defaultTo(knex.fn.now());
    table.timestamp("data_atualizacao").defaultTo(knex.fn.now());
    table.integer("usuario_criacao_id").unsigned().references("id").inTable("usuarios").onDelete("SET NULL");
    table.integer("usuario_atualizacao_id").unsigned().references("id").inTable("usuarios").onDelete("SET NULL");
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable("produtos");
};
