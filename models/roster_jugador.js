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
    id_roster: DataTypes.INTEGER,
    id_jugador: DataTypes.INTEGER,
    rol_en_roster: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Roster_Jugador',
  });
  return Roster_Jugador;
};