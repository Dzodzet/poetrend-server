// Imports

const { ladderLoop } = require('./functions')
const { testConnection, Character, Frozen, Activity, Skill, State } = require('../../sql.js')
const { Op } = require('sequelize')


// PARAMS
const updateRangeInDays = 1/24*31/60
const DELTAMINMIN = 1
const DELTAMINMAX = 20


async function updateFrozenList(league, minRank, maxRank) {

    if (maxRank < minRank | maxRank > 15000) { console.log("Invalid arguments"); return; }

    // ladder extraction loop (array of objects)
    let JSONladder = await ladderLoop(minRank, maxRank, league)

    // Filter ladder
    JSONladder = Object.values(JSONladder).filter(x => x.dead === false && x.retired !== true);

    // 1. Fill Frozenlist and Characters
    const inserts = []; const chars = [];

    for (char of JSONladder) {
        inserts.push(
            {
                CharacterCharID: char.character.id,
                xp: char.character.experience,
                lvl: char.character.level,
                league,
                class: char.character.class,
                attime: char.cached_since,
                alive: !char.dead,
            }
        )
        
        chars.push(
            {
                charID: char.character.id,
                charName: char.character.name,
                accName: char.account.name,
                league,
            }
        )
    }
    // Insert
    await Character.bulkCreate(chars, {ignoreDuplicates: true})
    await Frozen.bulkCreate(inserts)

    // 2. Insert ActiveList

    console.time('get frozen data')
    const frozenData = await Frozen.findAll(
        {
            where: {
                attime: { [Op.gt]: new Date(new Date() - updateRangeInDays * 24 * 60 * 60 * 1000) }
            },
            order: [['CharacterCharID'], ['attime']],
            raw: true,//!!!!
        }
    )
    console.timeEnd('get frozen data')


    console.time('building activeArray')
    const activeArray = []
    for (let i = 0; i < frozenData.length - 1; i++) {
        if (frozenData[i].CharacterCharID === frozenData[i + 1].CharacterCharID) {
            let active = frozenData[i]
            let active2 = frozenData[i + 1]
            //console.log(new Date(active2.attime) - new Date(active.attime))
            let deltaMin = (new Date(active2.attime) - new Date(active.attime)) / 1000 / 60
            let deltaxp = active2.xp - active.xp

            if (deltaMin < DELTAMINMAX && deltaMin > DELTAMINMIN && deltaxp > 1000) {
                activeArray.push({
                    CharacterCharID: active.CharacterCharID,
                    starttime: active.attime,
                    endtime: active2.attime,
                    deltaxp,
                    xph: Math.round(deltaxp / deltaMin * 60 / 1000000 * 100) / 100,
                    xp: active.xp,
                    lvl: active.lvl,
                })
            }
        }
    }
    console.timeEnd('building activeArray')

    //console.log(activeArray, 'activearray1')
    if (activeArray.length > 0) {
        console.time('create bulk activity')
        await Activity.bulkCreate(activeArray, {ignoreDuplicates: true,})//updateOnDuplicate: ["xp", "lvl"]
        console.timeEnd('create bulk activity')

        // Link Activity with Skill
        console.time('link act with state')
        let activities = await Activity.findAll({
            include: [
                { model: State, required: false },
            ],
            where: {
                starttime: { [Op.gt]: new Date(new Date() - updateRangeInDays * 24 * 60 * 60 * 1000) },
            },
        })
        //console.log(JSON.stringify(activities[0],null,4))
        
        let states = await State.findAll()

        for (a of activities) {
            // keep only matching char ID
            let filteredStates = states.filter(s => s.CharacterCharID === a.CharacterCharID && s.statetime < a.starttime)

            if (filteredStates.length == 0) {
                continue;
            } 
            let mat = filteredStates.reduce((a, b) => (a.starttime > b.starttime ? a : b)).statetime
            
            filteredStates = filteredStates.filter(s => {
                return s.statetime - mat == 0
            })
            for (s of filteredStates) {
                await s.addActivity(a)
            }

        }
        console.timeEnd('link act with state')
        
    }

}


module.exports = {
    updateFrozenList
}