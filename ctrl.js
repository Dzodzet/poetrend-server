// Imports

const { Character, Skill, Activity, sequelize, State } = require('./sql.js')
const { Op } = require('sequelize')


// Functions 
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

const getSkills = async (skillOrder, callback) => {
    /*
    from a skillOrder object (league, starttime in H, endtime, minlvl, maxlvl)
    get a response object containing data for webpage containing skill and frequencies and deltas
    */
    console.time('getSkills')

    // variables
    const nbDays = skillOrder.starttime * 2 / 24
    const requestDateTime = new Date()

    // 1sql query
    let activities = await Activity.findAll({
        attributes: ['starttime', 'endtime'],
        where: { 'starttime': { [Op.gt]: requestDateTime.getTime() - 1000 * 60 * 60 * 24 * nbDays } },
        include: [
            {
                model: State,
                required: true,
                include: [
                    {
                        model: Skill,
                        required: true,
                        attributes: ['skillName'],
                        where: { priority: 1 },
                        //limit:1
                    },
                    {
                        model: Character,
                        required: true,
                        attributes: [],
                        where: {
                            league: { [Op.eq]: skillOrder.league },
                        },
                    }
                ]
            }
        ]
    }
    )

    // activities = activities.concat(activities, activities) // 3
    // activities = activities.concat(activities, activities) // 9
    // activities = activities.concat(activities, activities) // 27
    // activities = activities.concat(activities, activities) // 81

    // initialize array of response rows {sn: ..., frequencies: [0,0,...]}
    let res = [...new Set(activities.map(activity => activity.State.Skills[0].skillName))] // based on unique skill list
    res = res.map(sn => {
        return {
            skillName: sn,
            frequencies: new Array(nbDays).fill(0)
        }
    });

    // increase minutes played
    activities.forEach(activity => {
        let deltaDays = Math.floor((requestDateTime - activity.endtime) / 1000 / 60 / 60 / 24)
        if (deltaDays < nbDays) {
            res[res.findIndex(e => e.skillName === activity.State.Skills[0].skillName)]['frequencies'][deltaDays] += Math.floor((activity.endtime - activity.starttime) / 1000 / 60); // Evite les bug de décalage horaire
        } 
    });

    // calc ratios and trends
    let totalMinPlayedBySplit = [0,0]
    res.forEach(skillObj => {

        // Calc total time played 1st period
        skillObj.freqT1 = skillObj.frequencies.slice(0, Math.floor(nbDays / 2)).reduce((a, b) => a + b, 0)
        totalMinPlayedBySplit[0] += skillObj.freqT1

        // Calc total time played 2nd period
        skillObj.freqT2 = skillObj.frequencies.slice(Math.floor(nbDays / 2), Math.floor(nbDays)).reduce((a, b) => a + b, 0)
        totalMinPlayedBySplit[1] += skillObj.freqT2

        // Calc delta in time played abs
        skillObj.deltaPercent = skillObj.freqT1 / skillObj.freqT2 - 1
    })

    res.forEach(skillObj => {
        // Calc % of skill played vs total & delta
        skillObj.freqT1Ratio = skillObj.freqT1 / totalMinPlayedBySplit[0]
        skillObj.freqT2Ratio = skillObj.freqT2 / totalMinPlayedBySplit[1]
        skillObj.deltaRatio = skillObj.freqT1Ratio - skillObj.freqT2Ratio
    })

    let totFreqArray = new Array(nbDays).fill(0)
    for (i = 0; i < nbDays; i++) {
        res.forEach(e => totFreqArray[i] += e.frequencies[i])
    }
    res.forEach(e => e.frequencies = e.frequencies.map((v, index) => { return v / totFreqArray[index] || 0 }))


    if (res.length > 0) {
        var code = 200
    } else {
        var code = 204
    }

    console.timeEnd('getSkills')
    console.log('Responding with', res.length, 'rows')
    //console.log(JSON.stringify(res).length) size of the answer
    callback({ code, tmp: res })
}

const getSdr = async (params, callback) => {
    // params: { nbDaysHist, league }
    console.log('getSdr called in ctrl')
    console.time('sql getSdr')
    let activities = await Activity.findAll({
        where: {
            starttime: { [Op.between]: [new Date(new Date() - 1000 * 60 * 60 * 24 * params.nbDaysHist), new Date(new Date() - 1000 * 60 * 60 * 24 * 0)] },
        },
        attributes: [
            "starttime",
            "deltaxp",
            "endtime",
            "lvl",
            // [sequelize.col('Skills.skillName'), 'skillName'],
            // [sequelize.col('Skills.Character.accName'), 'accName'],
            // [sequelize.col('Skills.Character.charName'), 'charName'],
        ],
        include: [
            {
                model: State,
                required: true,
                attributes: ["id"],
                include: [
                    {
                        model: Skill,
                        required: true,
                        attributes: ['skillName'],
                        where: { priority: 1 },
                        //limit:1
                    },
                    {
                        model: Character,
                        required: true,
                        attributes: ['charName'],
                        where: {
                            league: { [Op.eq]: params.league },
                        },
                    }
                ]
            }
        ],

        raw: false,
        nest: false,
        logging: console.log,
        separate: false,
    })
    console.timeEnd('sql getSdr')
    //console.dir(activities[0].get({ plain: true }), { depth: null })

    console.log(activities.length)
    console.time('getSdr no sql')

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
            let cn = value.State.Character.charName
            let skill = value.State.Skills[0].skillName
            if (!res[cn]) {
                res[cn] = {
                    charName: cn,
                    nbmin: 0,
                    deltaxpCorrected: 0,
                    lvl: value.lvl,
                    skill: skill,
                    rawData: [],
                }
                result.push(res[cn])
            }
            if (skill == res[cn].skill) {
                res[cn].nbmin += value.nbmin
                res[cn].deltaxpCorrected += value.deltaxpCorrected
                res[cn].rawData.push(value)
            }
            return res;
        }, {})
        //console.dir(result, {depth:null})
        const { quantile } = require('d3')
        for (res of result) {
            res.xphCorrected = res.deltaxpCorrected / 1e6 / (res.nbmin / 60)
            let tmp = res.rawData.map(i => i.deltaxpCorrected / 1e6 / (i.nbmin / 60))
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
    console.timeEnd('getSdr no sql')

    console.log('Responding with', resData.length, 'rows')
    callback({ code, res: resData })
}

const buffer = {}
const getDetail = async (charName, callback) => {
    /*
    Extract from DB the details for a character
    */
    const maxDelayMinutes = 10
    console.time('getDetail')
    let res = []

    if (!buffer[charName] || (new Date() - buffer[charName].time) / 1000 / 60 > maxDelayMinutes) {
        // SQL QUERY
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
                    model: State,
                    //attributes: [],
                    required: true,
                    include: [
                        {
                            model: Skill,
                            //attributes: [],
                            required: true,
                            //where: {league: { [Op.eq]: params.league }}
                        },
                        {
                            model: Activity,
                            //attributes: [],
                            required: true,
                            //where: {league: { [Op.eq]: params.league }}
                        },
                    ]
                },
            ],

            raw: true,
            nest: false,
        })
        //console.log(details)
        res = details.map((act) => Math.round(act['States.Activities.xph'] / xpMulti(82, act['States.Activities.lvl'])))
        buffer[charName] = { data: res, time: new Date() }
    } else {
        res = buffer[charName]["data"]
    }


    if (res.length > 0) {
        var code = 200
    } else {
        var code = 204
    }

    //console.log('Responding with', res.length, 'rows')

    console.timeEnd('getDetail')
    callback({ code, res })
}

module.exports = {
    getSkills,
    getSdr,
    getDetail,
};