exports.up = function (knex) {
    return knex.schema.table("usuarios", (table) => {
      table.boolean("ativo").defaultTo(true);
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.table("usuarios", (table) => {
      table.dropColumn("ativo");
    });
  };
  
  // npx knex migrate:latest  