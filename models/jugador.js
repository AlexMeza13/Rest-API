'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Jugador extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Jugador.belongsToMany(models.Roster, {
        through: models.Roster_Jugador,
        foreignKey: 'id_jugador'
      });
    }
  }
  Jugador.init({
    nickname: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    nombre_real: DataTypes.STRING,
    pais: DataTypes.STRING,
    rol: DataTypes.STRING,
    estado: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Jugador',
  });
  return Jugador;
};