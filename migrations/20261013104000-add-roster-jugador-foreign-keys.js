'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('Roster_Jugadors', 'id_roster', {
      type: Sequelize.INTEGER,
      allowNull: false
    });
    await queryInterface.changeColumn('Roster_Jugadors', 'id_jugador', {
      type: Sequelize.INTEGER,
      allowNull: false
    });

    await queryInterface.addConstraint('Roster_Jugadors', {
      fields: ['id_roster'],
      type: 'foreign key',
      name: 'fk_roster_jugadors_roster',
      references: {
        table: 'Rosters',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
    await queryInterface.addConstraint('Roster_Jugadors', {
      fields: ['id_jugador'],
      type: 'foreign key',
      name: 'fk_roster_jugadors_jugador',
      references: {
        table: 'Jugadors',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint(
      'Roster_Jugadors',
      'fk_roster_jugadors_jugador'
    );
    await queryInterface.removeConstraint(
      'Roster_Jugadors',
      'fk_roster_jugadors_roster'
    );

    await queryInterface.changeColumn('Roster_Jugadors', 'id_roster', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
    await queryInterface.changeColumn('Roster_Jugadors', 'id_jugador', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
  }
};
