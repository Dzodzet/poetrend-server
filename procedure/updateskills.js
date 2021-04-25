const { ladderLoop, getJSONchar } = require('./functions')

const moment = require('moment');

var mysql = require('mysql');

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "poetrend2"
});

// params

const minRank = 1
const maxRank = 150
const excludedSkills = ['Spellslinger Support', 'Pride', 'Blood Rage', 'Portal', 'Berserk', 'Precision',
    'Punishment', 'Grace', 'Vitality', 'Discipline']
const excludedSkillTags = ['Movement', 'Guard', 'Stance', 'Warcry', 'Curse']

var links = [];

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function getSkills(charName, accName) {
    let skills = []

    // extract character sheet
    char = await getJSONchar(charName, accName);

    // ???
    if (char == "undefined") {
        console.log("undefined out !?!?")
        return skills
    }

    // get itemlists
    let items = char.items

    // Next char if no item equiped
    if (!items.length) {
        console.log('No items equiped !')
        return skills
    }

    // filter 5+ link items
    items = items.filter(item => item.w == 2 && item.h >= 3 && "sockets" in item && "socketedItems" in item && item.socketedItems.length > 4);

    for (item of items) {
        // Filter 5+linked skill gems !! (bad)
        let linksByGroup = [0, 0, 0, 0, 0, 0]
        item.sockets.forEach((socket) => linksByGroup[socket.group]++);
        if (Math.max(...linksByGroup) < 5) { continue }
        let correctGroup = linksByGroup.indexOf(Math.max(...linksByGroup));
        let linkedSockets = []
        item.sockets.forEach(function (socket, index) {
            if (socket.group == correctGroup) {
                linkedSockets.push(index);
            }
        });

        // filter desired skill gems (tag, level, non-support) !!!
        const tagFilter = (name) => {
            let res = false
            excludedSkillTags.forEach(tag => {
                if (name.includes(tag)) { res = true; }
            })
            return res
        }

        let filteredSitems = item.socketedItems.filter((sitem) =>
            sitem.support == false // Supports out
            && linkedSockets.includes(sitem.socket) // non linked out (5l)
            && !(tagFilter(sitem.properties[0].name)) // contains wrong tag
            && parseInt(sitem.properties[1].values[0][0].substring(0, 2)) > 14 // level too low
        );

        // Detect leveling weapon by multiple linked same gems
        let skillFreqInItem = filteredSitems.reduce((o, n) => {
            n.typeLine in o ? o[n.typeLine] += 1 : o[n.typeLine] = 1;
            return o;
        }, {});
        if (Math.max(...Object.values(skillFreqInItem)) > 1) {
            console.log("Items contains multiple times the same skill gem called ", skillFreqInItem, ". Next item !")
            continue
        }
        if (item.inventoryId == 'Weapon2') console.log(" Carefull, weapon 2 slot and passed the test !")

        // Harvest skill gem names
        filteredSitems.forEach(sitem => {
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
    let JSONladder = []

    // ladder extraction loop (JSON)
    JSONladder = await ladderLoop(minRank, maxRank, "SSF Ritual HC")

    // Filter out => dead, private, retired
    JSONladder = Object.values(JSONladder).filter(x => x.dead === false && x.public === true && !(x.retired === true));
    let numberOfChars = JSONladder.length
    // await skills loop
    for (let [index, char] of JSONladder.entries()) {
        console.log(index + 1, " / ", numberOfChars)
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

    console.log(linkDict, " -> linkDict")

    // TO DO -> exporter le linkdict to links.json
    // const fs = require('fs')
    // // convert JSON object to string
    // const data = JSON.stringify(linkDict);

    // write JSON string to a file
    // fs.writeFile('links.json', data, (err) => {
    // if (err) {
    //     throw err;
    // }
    // console.log("JSON data is saved.");
    // });



    var inserts = [];
    JSONladder.forEach(char =>

        char.character.skills.map(skill => {
            return inserts.push([char.character.id, skill.toString(), moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')]);
        })
        //inserts.push([char.character.id, char.character.skills.toString(), moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')])
    );
    //console.log(inserts, 'inserts');
    // build query loop
    queryy =
        `REPLACE INTO SKILLS
    (CHARID, SKILL, ATTIME) 
    VALUES ?`
    con.query({ sql: queryy, values: [inserts] }, function (err, result) {
        if (err) throw err;
        console.log(result);
    });

}



main();




// get existing data


// compare ladder with existing data
// if empty skill || too old => 
    // update skill function
    // update sql data or add sql data
