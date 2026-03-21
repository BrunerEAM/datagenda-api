exports.up = function(knex) {
  return knex.schema.createTable('campos_ficha', function(table) {
    table.increments('id').primary();
    table.integer('documento_id').unsigned().notNullable();
    table.string('tipo', 50).notNullable(); // Ex: 'Texto Curto', 'Lista de Escolhas'
    table.string('nome_campo').notNullable(); // Nome do campo
    table.text('opcoes'); // Armazena as opções de uma lista de escolhas (em JSON)
    table.integer('ordem').notNullable(); // Posição do campo na lista
    table.boolean('mesma_linha').defaultTo(false); // Indica se o campo é na mesma linha
    table.string('status', 20).defaultTo('ativo'); // 'ativo' ou 'inativo'

    // Chave estrangeira para a tabela de documentos
    table.foreign('documento_id')
      .references('id')
      .inTable('documentos')
      .onDelete('CASCADE'); // Se o documento for excluído, os campos também serão
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('campos_ficha');
};