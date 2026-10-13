'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.addConstraint('Roster_Jugadors', {
      fields: ['id_roster', 'id_jugador'],
      type: 'unique',
      name: 'uq_roster_jugadors_roster_jugador'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint(
      'Roster_Jugadors',
      'uq_roster_jugadors_roster_jugador'
    );
  }
};
