const { Sequelize, DataTypes, Op } = require('sequelize');

const sequelize = new Sequelize("poetrenddb", "root", "root", {
    host: "localhost",
    dialect: "mysql",
    port: 3306,
    logging:false,
});


const Character = sequelize.define('Character', {
    charID: { type: DataTypes.STRING, primaryKey: true },
    charName: { type: DataTypes.STRING },
    accName: { type: DataTypes.STRING },
    league: { type: DataTypes.STRING },
},
    { timestamps: false });

const Skill = sequelize.define('Skill', {
    //charID: { type: DataTypes.STRING, references : { model: Character, key: 'charID' } },
    skillName: { type: DataTypes.STRING(50) },
    attime: { type: DataTypes.DATE },
},
    { timestamps: false });

const Frozen = sequelize.define('Frozen', {
    //charID: { type: DataTypes.STRING, references : { model: Character, key: 'charID' } },
    xp: { type: DataTypes.INTEGER.UNSIGNED },
    lvl: { type: DataTypes.TINYINT },
    league: { type: DataTypes.STRING(255) },
    class: { type: DataTypes.STRING(40) },
    attime: { type: DataTypes.DATE },
    alive: { type: DataTypes.BOOLEAN },
},
    { timestamps: false });

const Activity = sequelize.define('Activity', {
    //charID: { type: DataTypes.STRING, unique: 'combo', references : { model: Character, key: 'charID' }},
    starttime: { type: DataTypes.DATE, unique: 'combo' },
    endtime: { type: DataTypes.DATE },
    deltaxp: { type: DataTypes.INTEGER },
    xph: { type: DataTypes.FLOAT },
    CharacterCharID: { type: DataTypes.STRING, unique: 'combo', references : { model: Character, key: 'charID' } },
}
    , { timestamps: false });

const Activity_Skill = sequelize.define('Activity_Skill', {}, { timestamps: false });

Character.hasMany(Skill);
Skill.belongsTo(Character);

Character.hasMany(Frozen);
Frozen.belongsTo(Character);

Activity.belongsToMany(Skill, { through: 'Activity_Skill' });
Skill.belongsToMany(Activity, { through: 'Activity_Skill' })


const testConnection = async () => {

    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
    await sequelize.sync({alter:false}).then(console.log('synced'));
    // await sequelize.query('show tables').then(function (rows) {
    //     console.log('list of tables => ', JSON.stringify(rows));
    // });

}

//testConnection();

module.exports = {
    sequelize,
    testConnection,
    Character,
    Skill,
    Frozen,
    Activity
};



