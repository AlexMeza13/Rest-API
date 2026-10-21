'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Usuarios', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      email: {
        type: Sequelize.STRING(254),
        allowNull: false,
        unique: true
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      rol: {
        type: Sequelize.ENUM('admin', 'entrenador'),
        allowNull: false,
        defaultValue: 'entrenador'
      },
      estado: {
        type: Sequelize.ENUM('activo', 'inactivo'),
        allowNull: false,
        defaultValue: 'activo'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Usuarios');
  }
};
