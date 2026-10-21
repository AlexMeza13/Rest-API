'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const [users] = await queryInterface.sequelize.query(
      "SELECT `id` FROM `Usuarios` WHERE `email` = 'entrenador@gmail.com' AND `rol` = 'entrenador' AND `estado` = 'activo' LIMIT 1"
    );
    if (users.length === 0) {
      throw new Error('No se encontro un entrenador activo con el correo entrenador@gmail.com');
    }

    await queryInterface.addColumn('Rosters', 'id_entrenador', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Usuarios',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.sequelize.query(
      'UPDATE `Rosters` SET `id_entrenador` = :idEntrenador WHERE `id_entrenador` IS NULL',
      { replacements: { idEntrenador: users[0].id } }
    );
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Rosters', 'id_entrenador');
  }
};
