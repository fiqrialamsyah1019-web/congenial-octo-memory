const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize({ dialect: 'sqlite', storage: './database.sqlite', logging: false });

const Project = sequelize.define('Project', {
    name: DataTypes.STRING,
    mode: DataTypes.STRING,
    takt: DataTypes.FLOAT
});

const Station = sequelize.define('Station', {
    name: DataTypes.STRING,
    time: DataTypes.FLOAT
});

// Relasi One-to-Many
Project.hasMany(Station);
Station.belongsTo(Project);

module.exports = { sequelize, Project, Station };
