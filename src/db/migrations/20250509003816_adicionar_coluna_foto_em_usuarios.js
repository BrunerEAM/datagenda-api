exports.up = function (knex) {
    return knex.schema.alterTable("usuarios", function (table) {
      table.string("foto").nullable();
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.alterTable("usuarios", function (table) {
      table.dropColumn("foto");
    });
  };
  