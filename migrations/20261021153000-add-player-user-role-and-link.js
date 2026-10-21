'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('Usuarios', 'rol', {
      type: Sequelize.ENUM('admin', 'entrenador', 'jugador'),
      allowNull: false,
      defaultValue: 'entrenador'
    });

    await queryInterface.addColumn('Usuarios', 'id_jugador', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Jugadors',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addConstraint('Usuarios', {
      fields: ['id_jugador'],
      type: 'unique',
      name: 'uq_usuarios_jugador'
    });
  },

  async down(queryInterface, Sequelize) {
    const [rows] = await queryInterface.sequelize.query(
      "SELECT COUNT(*) AS total FROM `Usuarios` WHERE `rol` = 'jugador'"
    );
    if (Number(rows[0].total) > 0) {
      throw new Error('No se puede revertir: existen cuentas con rol jugador');
    }

    await queryInterface.removeConstraint('Usuarios', 'uq_usuarios_jugador');
    await queryInterface.removeColumn('Usuarios', 'id_jugador');
    await queryInterface.changeColumn('Usuarios', 'rol', {
      type: Sequelize.ENUM('admin', 'entrenador'),
      allowNull: false,
      defaultValue: 'entrenador'
    });
  }
};
