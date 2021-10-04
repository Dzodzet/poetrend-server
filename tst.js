const { Character, Skill, Activity, sequelize, testConnection, Frozen, State } = require('./sql.js')
const { Op } = require('sequelize')
const { createPool } = require('mysql2/promise')
//var mysql = require('mysql');

// const sequelize = new Sequelize({
//   dialect: 'sqlite',
//   storage: 'db.sqlite',
//   logging: false
// })


async function main() {
  const frozenData = await Frozen.findAll(
    {
        where: {
            attime: { [Op.gt]: new Date(new Date() - 50 * 24 * 60 * 60 * 1000) }
        },
        order: [['CharacterCharID'], ['attime']],
        raw: true,//!!!!
    }
)
console.log(frozenData)
      
}

main();

