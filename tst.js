const { Character, Skill, Activity, sequelize, testConnection } = require('./sql.js')
const { col, Op } = require('sequelize')

async function main() {
    await testConnection()
    console.time('is it fast ?')
    let acts = await Activity.findAll({
            //where: {charID:'cd127c82b13c9f2b4252069ba96214ce546cb6b0b8d81b738bbcd3b09251034b'},
            include: [
                //{ all:true, nested: true, required:true }
                { model: Skill, required: true },
            ],
            //order: [['id', 'desc']],
        raw: false,
        nest: true,
    })
    //console.log(acts)
    let x = []
    acts.forEach(act => x.push(act.get({ plain: true })))
    console.timeEnd('is it fast ?')
    console.log(JSON.stringify(x,null,7), x.length);

}

main();