// Imports

const moment = require('moment');
const { ladderLoop, getJSONchar } = require('./functions')
const { Character, Skill } = require('../sql.js')


// PARAMS

const minRank = 9
const maxRank = 20
const league = "SSF Ultimatum HC"
const excludedSkills = ['Spellslinger Support', 'Pride', 'Blood Rage', 'Portal', 'Berserk', 'Precision',
    'Punishment', 'Grace', 'Vitality', 'Discipline']
const excludedSkillTags = ['Movement', 'Guard', 'Stance', 'Warcry', 'Curse', 'Aura']

var links = [];

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function getSkills(charName, accName) {
    let skills = [] // response array

    // extract character sheet
    const char = await getJSONchar(charName, accName);

    // undefined
    if (char == "undefined") {
        console.log("undefined out !?!?")
        return skills
    }

    // get itemlists
    let items = char.items || [] //? char.items :

    // Next char if no item equiped
    if (!items.length) {
        console.log('No items equiped !')
        return skills
    }

    // filter items with socketed gems
    items = items.filter(item => item.w == 2 && item.h >= 2 && "sockets" in item && "socketedItems" in item && item.socketedItems.length >= 4);

    //console.dir(items[0], {depth: null})



    for (item of items) {
        // number of support items
        let isSpellslinger = false;
        for (i of item.socketedItems) {
            if (i.typeLine == 'Spellslinger Support') {
                console.log('spellslinger support detected')
                isSpellslinger = true
            } 
        }
        if (item.socketedItems.filter((sitem) => sitem.support == true).length < 2) {
            console.log('too few supports gems => next item')
            continue
        }

        // Filter 5+linked skill gems !! (bad)

        //console.dir(item, {depth:null})
        const findCorrectSocketGroup = (sockets) => {
            const linkArray = sockets.reduce((res, socket) => {
                const group = socket.group
                res[group] = res[group] || 0
                res[group] += 1
                return res
            }, [0, 0, 0, 0, 0, 0])
            const nbMaxLinks = Math.max(...linkArray)
            if (nbMaxLinks <= 3) return -1
            const correctGroup = linkArray.indexOf(nbMaxLinks);
            return correctGroup
        }
        const correctSocketGroup = findCorrectSocketGroup(item.sockets)
        if (correctSocketGroup == -1) continue
        const linkedSocketedItems = item.socketedItems.filter((sitem, index) => { return item.sockets[index].group == correctSocketGroup })


        // filter desired skill gems (tag, level, non-support) !!!
        const tagFilter = (name) => {
            let res = false
            excludedSkillTags.forEach(tag => {
                if (name.includes(tag)) { res = true; }
            })
            return res
        }

        let filteredLinkedSocketedItems = linkedSocketedItems.filter((sitem) =>
            sitem.support == false // Supports out
            && !(tagFilter(sitem.properties[0].name)) // contains wrong tag
            && parseInt(sitem.properties[1].values[0][0].substring(0, 2)) > 14 // level too low
        );
        // const nbSupportGems = item.socketedItems.filter((sitem) =>
        //     sitem.support == true // Supports out
        // ).length

        // Detect leveling weapon by multiple linked same gems
        let skillFreqInItem = filteredLinkedSocketedItems.reduce((o, n) => {
            n.typeLine in o ? o[n.typeLine] += 1 : o[n.typeLine] = 1;
            return o;
        }, {});
        if (Math.max(...Object.values(skillFreqInItem)) > 1) {
            console.log("Items contains multiple times the same skill gem called ", skillFreqInItem, ". Next item !")
            continue
        }
        if (item.inventoryId == 'Weapon2') console.log(" Carefull, weapon 2 slot and passed the test !")

        // Harvest skill gem names
        filteredLinkedSocketedItems.forEach(sitem => {
            let name = sitem.typeLine.replace('Vaal ', '');

            if (!excludedSkills.includes(name)) {
                skills.push(name);
            }
            links.push({ name, icon: sitem.icon });
        });

    }
    return skills
}


async function main() {
    // extract ladder
    let JSONladder = await ladderLoop(minRank, maxRank, league)


    /* JSONladder[0]
    // {
    //     rank: 1,
    //     dead: false,
    //     character: {
    //       id: '73dabcd3d9f242b5438899e3704067cf43269d7111a485acd1347bee49bdfa87',
    //       name: 'premiumㆍTowerbrah',
    //       level: 100,
    //       class: 'Gladiator',
    //       experience: 4250334444,
    //       depth: { default: 2, solo: 2 }
    //     },
    //     account: {
    //       name: 'Towerbrah',
    //       realm: 'pc',
    //       challenges: { total: 14 },
    //       twitch: { name: 'towerbrah' }
    //     },
    //     cached_since: '2021-05-31T12:22:06+00:00'
    //   }
    */

    // Create bulk of Character
    const chars = JSONladder.map(ladderRow => {
        return {
            charID: ladderRow.character.id,
            charName: ladderRow.character.name,
            accName: ladderRow.account.name,
            league,
        }
    })
    await Character.bulkCreate(chars, { ignoreDuplicates: true }).then(console.log('Character.bulkCreate ok')).catch(err => console.log(err))

    // Filter out => dead, private, retired
    JSONladder = Object.values(JSONladder).filter(x => x.dead === false && x.public === true && !(x.retired === true));

    // add Skills property to JSONladder entries
    const numberOfChars = JSONladder.length
    for (let [index, char] of JSONladder.entries()) {
        console.log(`${index + 1} / ${numberOfChars}`);
        let start = new Date().getTime();
        char.character.skills = await getSkills(char.character.name, char.account.name);
        let end = new Date().getTime();
        await sleep(1334 - (end - start));
        console.log(char.character.skills);
    }

    // get icons...
    var linkDict = {}
    links.map(link => {
        return linkDict[link.name] = link.icon;
    })


    var inserts = []
    JSONladder.forEach(char =>
        char.character.skills.map(skill => {
            return inserts.push({
                CharacterCharID: char.character.id,
                skillName: skill.toString(),
                attime: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss'),
            }
            )
        }));

    const x = await Skill.bulkCreate(inserts);

}



main();




// get existing data


// compare ladder with existing data
// if empty skill || too old => 
    // update skill function
    // update sql data or add sql data
