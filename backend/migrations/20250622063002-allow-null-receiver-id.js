"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("messages", "receiver_id", {
      type: Sequelize.INTEGER,
      allowNull: true, // ahora se permite null
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("messages", "receiver_id", {
      type: Sequelize.INTEGER,
      allowNull: false, // en caso de rollback
    });
  },
};
