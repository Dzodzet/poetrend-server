// Imports

const { Character, Skill, Activity, sequelize } = require('./sql.js')
const { Op } = require('sequelize')


// Functions 
function getUniqueArrayOfArrObjValues(arr, key) {
    const res = []
    for (e of arr) {
        if (!res.includes(e[key])) res.push(e[key])
    }
    return res
}

const getSkills = async (skillOrder, callback) => {
    /*
    from a skillOrder object (league, starttime in H, endtime, minlvl, maxlvl)
    get a response object containing data for webpage containing skill and frequencies and deltas
    */
    console.time('getSkills')

    // variables
    const res = []
    const nbDays = skillOrder.starttime * 2 / 24
    const requestDateTime = new Date()

    //sql query
    const activities = await Activity.findAll({
        attributes: ['starttime', 'endtime'],
        where: { 'starttime': { [Op.gt]: requestDateTime.getTime() - 1000 * 60 * 60 * 24 * nbDays } },
        include: [
            //{ all:true, nested: true, required:true }
            {
                model: Skill,
                required: true,
                attributes: ['skillName'],
                through: { attributes: [] }, //ne laisse pas de id inutil
                include: [{
                    model: Character,
                    required: true,
                    attributes: [],
                    where: {
                        league: { [Op.eq]: skillOrder.league },
                    },
                }]
            },

        ],
        //order: [['id', 'desc']],
        raw: true,
        nest: false,
    })


    // get arr of unique skillNames
    const uniqueSkills = getUniqueArrayOfArrObjValues(activities, 'Skills.skillName')

    // initialize array of response rows (skillName + empty frequencies)
    uniqueSkills.forEach(e => {
        res.push({ skillName: e, frequencies: new Array(nbDays).fill(0) })
    })

    // increase time played arrays
    activities.forEach(activity => {
        let sn = activity['Skills.skillName']
        let deltaDays = Math.floor((requestDateTime - activity.endtime) / 1000 / 60 / 60 / 24)
        if (deltaDays < nbDays) res[res.findIndex(e => e.skillName == sn)]['frequencies'][deltaDays] += Math.floor((activity.endtime - activity.starttime) / 1000 / 60); // Evite les bug de décalage horaire
    });





    // // //
    let totT1 = 0;
    let totT2 = 0;

    res.forEach(skillObj => {

        // Calc total time played 1st period
        skillObj.freqT1 = skillObj.frequencies.slice(0, Math.floor(nbDays / 2)).reduce((a, b) => a + b, 0)
        totT1 += skillObj.freqT1

        // Calc total time played 2nd period
        skillObj.freqT2 = skillObj.frequencies.slice(Math.floor(nbDays / 2), Math.floor(nbDays)).reduce((a, b) => a + b, 0)
        totT2 += skillObj.freqT2

        // Calc delta in time played abs
        skillObj.deltaPercent = skillObj.freqT1 / skillObj.freqT2 - 1
    })


    res.forEach(skillObj => {
        // Calc % of skill played vs total & delta
        skillObj.freqT1Ratio = skillObj.freqT1 / totT1
        skillObj.freqT2Ratio = skillObj.freqT2 / totT2
        skillObj.deltaRatio = skillObj.freqT1Ratio - skillObj.freqT2Ratio
    })

    if (res.length > 0) {
        var code = 200
    } else {
        var code = 204
    }

    console.timeEnd('getSkills')
    console.log('Responding with', res.length, 'rows')
    callback({ code, tmp: res })
}

const getSdr = async (params, callback) => {
    // params: { nbDaysHist, league }
    console.log('getSdr called in ctrl')

    let activities = await Activity.findAll({
        where: {
            starttime: { [Op.between]: [new Date(new Date() - 1000 * 60 * 60 * 24 * params.nbDaysHist), new Date(new Date() - 1000 * 60 * 60 * 24 * 0)] },
        },
        attributes: [
            "starttime",
            "deltaxp",
            "endtime",
            "lvl",
            [sequelize.col('Skills.skillName'), 'skillName'],
            [sequelize.col('Skills.Character.accName'), 'accName'],
            [sequelize.col('Skills.Character.charName'), 'charName'],
        ],
        include: [
            {
                model: Skill,
                attributes: [],
                required: true,
                include: [{
                    model: Character,
                    attributes: [],
                    required: true,
                    where: { league: { [Op.eq]: params.league } }
                },]
            },
        ],

        raw: true,
        nest: false,
    })

    const xpMulti = (zoneLvl, charLvl) => {
        let effectiveMonsterLvl = -0.03 * zoneLvl ** 2 + 5.17 * zoneLvl - 144.9
        let safeZone = Math.floor(3 + charLvl / 16)
        let effectiveDifference = Math.max(Math.abs(charLvl - effectiveMonsterLvl) - safeZone, 0)
        if (effectiveDifference == 0) return 1
        let multi = ((charLvl + 5) / (charLvl + 5 + effectiveDifference ** 2.5)) ** 1.5
        //console.log(multi, 'multi', effectiveMonsterLvl, 'eff monster lvl', effectiveDifference, 'effective diff')
        if (charLvl > 94) {
            let xpPenalty = {
                95: 1.065,
                96: 1.115,
                97: 1.187,
                98: 1.2825,
                99: 1.4,
            }
            multi = multi / (1 + 0.1 * (charLvl - 94)) / xpPenalty[charLvl]
        }
        let finalMulti = Math.max(multi, 0.01)
        return finalMulti
    }
    const buildSdrFromActivities = (data) => {
        // data: array of activity object (starttime, deltaxp, lvl, ...)

        // corrected delta xp + calc nbmin
        for (activity of data) {
            activity.deltaxpCorrected = activity.deltaxp / xpMulti(82, activity.lvl)
            activity.nbmin = (activity.endtime - activity.starttime) / 1000 / 60
        }

        // Reduce to totals
        let result = []
        data.reduce((res, value) => {
            if (!res[value.charName]) {
                res[value.charName] = {
                    charName: value.charName,
                    nbmin: 0,
                    deltaxpCorrected: 0,
                    lvl: value.lvl,
                    skill: value.skillName,
                    rawData: [],
                }
                result.push(res[value.charName])
            }
            if (value.skillName == res[value.charName].skill) {
                res[value.charName].nbmin += value.nbmin
                res[value.charName].deltaxpCorrected += value.deltaxpCorrected
                res[value.charName].rawData.push(value)
            }
            return res;
        }, {})
        //console.dir(result, {depth:null})
        const { quantile } = require('d3')
        for (res of result) {
            res.xphCorrected = res.deltaxpCorrected / 1e6 / (res.nbmin / 60)
            let tmp = res.rawData.map(i => i.deltaxpCorrected/1e6/(i.nbmin / 60))
            res.quantile = quantile(tmp, 0.5)
            
        }
        return result.filter(res => res.nbmin > 60).sort((a, b) => b.quantile - a.quantile)
    }
    let resData = buildSdrFromActivities(activities)

    if (resData.length > 0) {
        var code = 200
    } else {
        var code = 204
    }

    console.log('Responding with', resData.length, 'rows')
    callback({ code, res: resData })
}

const getDetail = async (charName, callback) => {
    console.log(charName, 'charName in ctrl.js')
    let details = await Character.findAll({
        where: {
            charName: { [Op.eq]: charName },
        },
        // attributes: [
        //     "starttime",
        //     "deltaxp",
        //     "endtime",
        //     "lvl",
        //     [sequelize.col('Skills.skillName'), 'skillName'],
        //     [sequelize.col('Skills.Character.accName'), 'accName'],
        //     [sequelize.col('Skills.Character.charName'), 'charName'],
        // ],
        include: [
            {
                model: Skill,
                //attributes: [],
                required: true,
                include: [{
                    model: Activity,
                    //attributes: [],
                    required: true,
                    //where: {league: { [Op.eq]: params.league }}
                },]
            },
        ],

        raw: true,
        nest: false,
    })

    let res = []
    details.forEach(act => {
        res.push(act['Skills.Activities.xph'])
    })



    if (details.length > 0) {
        var code = 200
    } else {
        var code = 204
    }

    console.log('Responding with', res.length, 'rows')
    callback({ code, res })
}

module.exports = {
    getSkills,
    getSdr,
    getDetail,
};