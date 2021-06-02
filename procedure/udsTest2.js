// Imports

const moment = require('moment');
const { ladderLoop, getJSONchar } = require('./functions')
const { Character, Skill, State } = require('../sql.js')


// PARAMS

const minRank = 5001
const maxRank = 5200
const league = "SSF Ultimatum HC"
const excludedSkills = [
    'Spellslinger Support',
    'Pride',
    'Blood Rage',
    'Portal',
    'Berserk',
    'Precision',
    'Punishment',
    'Grace',
    'Vitality',
    'Vigilant Strike'
]
const excludedSkillTags = ['Guard', 'Stance', 'Warcry', 'Curse', 'Aura', 'Travel']


function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function getSkills(charName, accName) {
    /*
    Responde with an array of preformated skills object :
    {
        name,
        type,
        nblinks,
        priority:1,
    }
    */
    let skills = []
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

    for (item of items) { // Loop over equiped items that have 4+ socketed gems

        // number of support items
        if (item.socketedItems.filter((sitem) => sitem.support == true).length < 2) {
            //console.log('too few supports gems => next item')
            continue
        }

        // Filter linkedSocketed gems in an array "linkedSocketedItems"
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

        // skill type of link group
        let type = 'Normal'
        for (i of linkedSocketedItems) {
            if (i.typeLine == 'Spellslinger Support') {
                console.log('spellslinger support detected')
                type = 'Spellslinger'
            }
            if (i.typeLine == 'Spell Totem Support') {
                console.log('Spell Totem Support detected')
                type = 'Totem'
            }
            if (i.typeLine == 'Blastchain Mine Support') {
                console.log('Blastchain Mine Support detected')
                type = 'Mine'
            }
            if (i.typeLine == 'Trap Support') {
                console.log('Trap Support detected')
                type = 'Trap'
            }

        }


        const nblinks = linkedSocketedItems.length

        // filter only active skills
        const filteredLinkedSocketedItems = linkedSocketedItems.filter((sitem) =>
            sitem.support == false // Supports out
            && !(tagFilter(sitem.properties[0].name)) // contains wrong tag
            && parseInt(sitem.properties[1].values[0][0].substring(0, 2)) > 10 // level too low
            && !excludedSkills.includes(sitem.typeLine.replace('Vaal ', ''))
        );

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
            skills.push({
                skillName: sitem.typeLine.replace('Vaal ', ''),
                type,
                nblinks,
                priority: 1
            })
        })
    }


    /*
     * Priority
     */
    const prioritySkills = ['Essence Drain', 'Exsanguinate', 'Puncture', 'Raise Spectre', 'Corrupting Fever']
    const badSkills = ['Bone offering', 'Frenzy', 'Cyclone']

    if (skills.length > 1) {
        let nbMaxLinks = Math.max(...skills.map(s => s.nblinks))
        skills.forEach(skill => { if (skill.nblinks < nbMaxLinks) { skill.priority += 2 } })
        if (skills.filter(skill => skill.priority == 1).length > 1) {
            // multiple #1 Priority
            if (skills.some(r => {console.log(r.skillName);return prioritySkills.includes(r.skillName);})) {
                console.log('#1')
                skills.forEach(skill => {if (!prioritySkills.includes(skill.skillName)) { skill.priority += 1 }})
            }
            if (skills.some(r=> badSkills.includes(r.skillName))) {
                console.log('#2')
                skills.forEach(skill => {if (badSkills.includes(skill.skillName)) { skill.priority += 1 }})
            }
            if (skills.filter(skill => skill.priority == 1).length > 1) console.error('multiple #1 Priority', 40404040404040404)
        }
    }
    console.log(skills)
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
    const charsToAnalyse = Object.values(JSONladder).filter(x => x.dead === false && x.public === true && !(x.retired === true));

    // add Skills property to JSONladder entries
    const numberOfCharsToAnalyse = charsToAnalyse.length

    const stateToInput = []
    for ([index, char] of charsToAnalyse.entries()) {
        console.log(`${index + 1} / ${numberOfCharsToAnalyse}`)
        let start = new Date().getTime();
        let skills = await getSkills(char.character.name, char.account.name)
        let end = new Date().getTime();
        await sleep(1334 - (end - start));
        stateToInput.push({
            CharacterCharID: char.character.id,
            statetime: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss'),
            Skills: skills,
        })
    }





    let x = await State.bulkCreate(stateToInput, {
        include: [Skill]
    })
    console.log(x.length, ' added this many states')
}



main();

