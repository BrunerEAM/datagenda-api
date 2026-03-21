exports.up = async function(knex) {
  const tabelas = [
    'usuarios',
    'clientes',
    'produtos',
    'servicos',
    'pacotes',
    'combos',
    'grupos',
    'equipamentos',
    'salas',
    'conjuntos',
    'conjunto_itens'
  ];

  for (const tabela of tabelas) {
    const existe = await knex.schema.hasTable(tabela);
    if (existe) {
      const temColuna = await knex.schema.hasColumn(tabela, 'empresa_id');
      if (!temColuna) {
        await knex.schema.alterTable(tabela, function(table) {
          table.integer('empresa_id');
        });
      }
    }
  }
};

exports.down = async function(knex) {
  const tabelas = [
    'usuarios',
    'clientes',
    'produtos',
    'servicos',
    'pacotes',
    'combos',
    'grupos',
    'equipamentos',
    'salas',
    'conjuntos',
    'conjunto_itens'
  ];

  for (const tabela of tabelas) {
    const existe = await knex.schema.hasTable(tabela);
    if (existe) {
      const temColuna = await knex.schema.hasColumn(tabela, 'empresa_id');
      if (temColuna) {
        await knex.schema.alterTable(tabela, function(table) {
          table.dropColumn('empresa_id');
        });
      }
    }
  }
};
