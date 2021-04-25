const { ladderLoop } = require('./functions')
const moment = require('moment');

var mysql = require('mysql');

// todo
// get min delta in activelist generation
// delete old frozen list ??
// get lvl if not already ??

const minRank = 200
const maxRank = 5000
const league = "SSF Ritual HC"
const updateRangeInDays = 1;

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "poetrend2"
  });

async function main() {
    var JSONladder = []

    if (maxRank<minRank | maxRank > 15000) {
        console.log("Invalid arguments"); return;
    } 

    // ladder extraction loop (JSON)
    JSONladder = await ladderLoop(minRank, maxRank, league)

    // Filter ladder
    JSONladder = Object.values(JSONladder).filter(x => x.dead === false);
    JSONladder = Object.values(JSONladder).filter(x => x.online === true);
    JSONladder = Object.values(JSONladder).filter(x => x.retired !== true);
    // console.log(JSONladder);


    // SQL
    let inserts = [];
    JSONladder.forEach(char =>
        inserts.push([char.character.id, char.character.experience, char.character.level, league,
        char.character.class, moment(char.cached_since).format('YYYY-MM-DD HH:mm:ss'), !char.dead])
    );
    //console.log(inserts);
    // build query loop
    queryy =
    `INSERT INTO frozenlist 
    (CHARID, XP, LVL, LEAGUE, CLASS, ATTIME, ALIVE) 
    VALUES ?`
    con.query({sql: queryy, values: [inserts]}, function (err, result) {
        if (err) throw err;
        console.log(result, " Frozenlist updated");
    });


    // // // UPDATING ACTIVE LIST !!

    // Get frozen data
    
    let frozenData = await new Promise(function (resolve, reject) {
        con.query(`SELECT * FROM poetrend2.frozenlist where TIMESTAMPDIFF(SECOND, now(), attime) < 60*60*24*${updateRangeInDays} ORDER BY CHARID, ATTIME`, function (err,res) {
            if (err) throw err;
            resolve(res.map((row) => ({ ...row, })));
        });
    });
    //console.log(frozenData)

    
    let activeArray = []

    for (let i = 0; i < frozenData.length-1; i++) {
        if (frozenData[i].CHARID === frozenData[i+1].CHARID) {
            let active = frozenData[i]
            active.attime2 = frozenData[i+1].ATTIME
            let deltaMin = (frozenData[i+1].ATTIME-frozenData[i].ATTIME)/1000/60
            if (deltaMin < 15 && deltaMin > 3 && frozenData[i+1].XP-frozenData[i].XP > 1000) {
                //(charid, starttime, endtime, deltaxp, xph)
                activeArray.push([
                    active.CHARID,
                    active.ATTIME,
                    active.attime2,
                    frozenData[i+1].XP-frozenData[i].XP,
                    Math.round((frozenData[i+1].XP-frozenData[i].XP)/deltaMin*60/1000000*100)/100,
                ])
            }
        }
    }

    //console.log(activeArray, " active to be added")
    if (activeArray.length > 0) {
        var insertactivequery =
        `REPLACE INTO activelist 
        (charid, starttime, endtime, deltaxp, xph)
        VALUES ?`
        con.query({sql: insertactivequery, values: [activeArray]}, function (err, result) {
            if (err) throw err;
            console.log(result, " Active updated");
            process.exit(1)
        });
    } else {
        console.log("No data to be added to active list")
        process.exit(1)
    }

}


main();
