const { performance } = require('perf_hooks');
const db = require('./db');

const openDB = function () {
    db.open("localhost", "root", "root", "poetrend2");
}

const closeDB = function () {
    db.close();
}

const getSkills = async (skillOrder, callback) => {
    /*
    from a skillOrder object (league, starttime in H, endtime, minlvl, maxlvl)
    get a response object containing data for webpage containing skill and frequencies and deltas
    */

    let t0 = performance.now()

    // 1. get playedArr => arr of object (charid, endtime, nbmin, skill, lvl, league, attime, mat)
    let playedArrSQL = await new Promise(function (resolve) {
        db.get(skillOrder.generateQueryForSkillsDetails(), [], function (data) { 
            resolve(data.map((row) => ({ ...row, })));
        });
    });
    let t1 = performance.now()
    console.log(t1 - t0, " ms for query detail")


    const getFrequency = (arr, arrayLen) => {
        // Return object with key as skillname and value as array of frequency per day
        // { Earthquake: [408, 637], ...} 

        let t0 = performance.now()
        let map = {};
        arr.forEach(item => {
            // créer un array de 0 pour chaque skill
            if (!map[item.SKILL]) {
                map[item.SKILL] = new Array(arrayLen).fill(0);
            }
            
            let deltaDays = Math.floor((Date.now()-new Date().getTimezoneOffset()*60*1000 - item.endtime) / 1000 / 60 / 60 / 24)
            // let deltaMin = (Date.now()-new Date().getTimezoneOffset()*60*1000 - item.endtime) / 1000 / 60 
            // let date1 = Date.now()
            // let date2 = new Date().getTimezoneOffset()*60*1000
            // let date3 = Date(date1 - date2)
            // console.log(deltaMin, " is the diff between ", date3, " and ", item.endtime)
            
            if (deltaDays < arrLen) map[item.SKILL][deltaDays] += item.nbmin; // Evite les bug de décalage horaire
        });
        let t1 = performance.now()
        console.log(t1 - t0, " ms for getFreq")
        return map;
    }

    let arrLen = skillOrder.starttime * 2 / 24
    let frequencies = getFrequency(playedArrSQL, arrLen)
    //console.log(frequencies);

    // 2. Create response object => 
    const createResponse = (skillActivities) => {
        // Initial variables
        let t0 = performance.now()
        let res = [];
        let listOfDistinctSkills = [];
        let totT1 = 0;
        let totT2 = 0;

        // Get distinct skill names => res push {skillName: xxx}
        skillActivities.forEach(activity => {
            if (!(listOfDistinctSkills.includes(activity.SKILL))) {
                listOfDistinctSkills.push(activity.SKILL)
                res.push({ skillName: activity.SKILL })
            }
        })

        res.forEach(skillObj => {
            // Add frequencies: (report from existing data)
            skillObj.frequencies = frequencies[skillObj.skillName] 

            // Calc total time played 1st period
            skillObj.freqT1 = skillObj.frequencies.slice(0, Math.floor(arrLen / 2)).reduce((a, b) => a + b, 0)
            totT1 += skillObj.freqT1

            // Calc total time played 2nd period
            skillObj.freqT2 = skillObj.frequencies.slice(Math.floor(arrLen / 2), Math.floor(arrLen)).reduce((a, b) => a + b, 0)
            totT2 += skillObj.freqT2

            // Calc delta in time played
            skillObj.deltaPercent = skillObj.freqT1 / skillObj.freqT2 - 1
        })

        res.forEach(skillObj => {
            // Calc % of skill played vs total & delta
            skillObj.freqT1Ratio = skillObj.freqT1 / totT1
            skillObj.freqT2Ratio = skillObj.freqT2 / totT2
            skillObj.deltaRatio = skillObj.freqT1Ratio - skillObj.freqT2Ratio
        })

        let t1 = performance.now()
        console.log(t1 - t0, " ms for createResponse")

        return res
    }

    let tmp = createResponse(playedArrSQL)


    if (tmp.length > 0) {
        var code = 200
    } else {
        var code = 204
    }
    callback({ code, tmp })
}



module.exports = {
    openDB,
    closeDB,
    getSkills
};