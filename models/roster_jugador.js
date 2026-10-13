'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Roster_Jugador extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Roster_Jugador.init({
    id_roster: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Rosters',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    id_jugador: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Jugadors',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    rol_en_roster: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Roster_Jugador',
    indexes: [{
      unique: true,
      name: 'uq_roster_jugadors_roster_jugador',
      fields: ['id_roster', 'id_jugador']
    }]
  });
  return Roster_Jugador;
};