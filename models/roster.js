'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Roster extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Roster.belongsToMany(models.Jugador, {
        through: models.Roster_Jugador,
        foreignKey: 'id_roster'
      });
    }
  }
  Roster.init({
    nombre: DataTypes.STRING,
    juego: DataTypes.STRING,
    tipo: DataTypes.STRING,
    temporada: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Roster',
  });
  return Roster;
};