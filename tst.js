const { Character, Skill, Activity, sequelize, testConnection, Frozen, State } = require('./sql.js')
const { col, Op } = require('sequelize')
const { createPool } = require('mysql2/promise')









async function main() {
    //await testConnection()
    console.time('is it fast ?')

    // let activities = await Activity.findAll({
    //     //where: { lvl: { [Op.eq]: null } },

    //     //group: ['date'],
    //     include: [
    //         {
    //             model: State,
    //             //attributes: [],
    //             required: true,

    //             include: [{
    //                 model: Skill,
    //                 //attributes: [],
    //                 required: true,
    //             },
    //             // {
    //             //     model: Activity,
    //             //     //attributes: [],
    //             //     required: true,

    //             // }
    //         ]
    //         },

    //     ],
    //     //order: [['id', 'desc']],
    //     raw: false,
    //     nest: true,
    // })
    const requestDateTime = new Date()
    let nbDays = 10
    const activities = await Activity.findAll({
        attributes: ['starttime', 'endtime'],
        where: { 'starttime': { [Op.gt]: requestDateTime.getTime() - 1000 * 60 * 60 * 24 * nbDays } },
        include: [
            //{ all:true, nested: true, required:true }
            {
                model: State,
                required: true,
                //attributes: [],
                include: [{
                    model: Character,
                    required: true,
                    attributes: ['charName'],
                    where: { league: { [Op.eq]: 'SSF Ultimatum HC' }, }
                },
                {
                    model: Skill,
                    required: true,
                    //attributes: ['charName'],
                    limit:1,
                    where: {
                        priority: { [Op.eq]: 1 },
                    },
                }]
            },

        ],
        //order: [['id', 'desc']],
        raw: false,
        nest: false,
    })

    //console.dir(activities, {depth:4})
    let x = []
    console.time('1')
    activities.forEach(e => console.log(e))//x.push(e.get({ plain: true }))
    console.timeEnd('1')
    console.timeEnd('is it fast ?')
    console.dir(x, { depth: 4 })




    // const buildSdrFromActivities = (data) => {
    //     // data: array of activity object (starttime, deltaxp, lvl, ...)
    //     for (activity of data) {
    //         activity.deltaxpCorrected = activity.deltaxp / xpMulti(82, activity.lvl)
    //         activity.nbmin = (activity.endtime - activity.starttime) / 1000 / 60
    //     }
    //     let result = []
    //     data.reduce((res, value) => {
    //         if (!res[value.charName]) {
    //             res[value.charName] = { charName: value.charName, nbmin: 0, deltaxpCorrected: 0, lvl: value.lvl }
    //             result.push(res[value.charName])
    //         }
    //         res[value.charName].nbmin += value.nbmin
    //         res[value.charName].deltaxpCorrected += value.deltaxpCorrected
    //         return res;
    //     }, {})
    //     for (res of result) {
    //         res.xphCorrected = res.deltaxpCorrected / 1e6 / (res.nbmin / 60)
    //     }
    //     return result.filter(res => res.nbmin > 60)
    // }
    // console.time('buildSdrFromActivities')
    // console.log(buildSdrFromActivities(activities)[0])
    // console.timeEnd('buildSdrFromActivities')
    // let result = []
    // for (let i = 0; i<30; i++) {
    //     // 1. filter data
    //     let targetDate = new Date(new Date - i*1000*60*60*24)
    //     let data = activities.filter(act => {
    //         return act.starttime.getFullYear() === targetDate.getFullYear() &&
    //         act.starttime.getDate() === targetDate.getDate() &&
    //         act.starttime.getMonth() === targetDate.getMonth();
    //     })
    //     console.log(targetDate, data.length)

    //     // 2. transform GOLD
    //     data.reduce((res, value) => {
    //         if (!res[value.charName]) {
    //             res[value.charName] = { charName: value.charName, nbmin: 0, deltaxpCorrected: 0, lvl: value.lvl }
    //             result.push(res[value.charName])
    //         }
    //         res[value.charName].nbmin += value.nbmin
    //         res[value.charName].deltaxpCorrected += value.deltaxpCorrected
    //         return res;
    //     }, {})
    //     //console.log(result)

    // }
    // for (res of result) {
    //     res.xphCorrected = res.deltaxpCorrected/1e6 / (res.nbmin / 60)
    // }


    // console.timeEnd('add xp multi')
    // console.log(JSON.stringify(activities[0], null, 7), activities.length);


    //console.dir(result.filter(x => x.nbmin > 60).sort((a,b)=> b.xphCorrected-a.xphCorrected), {depth: null})






    // console.log(xpMulti(77, 90))
    // let ac = x[0].Skills[0].Activities[0]
    // ac.correctedXph = ac.xph / xpMulti(82, ac.lvl)
    // console.log(ac)

    // console.time("a")
    // for (char of x) {
    //     char.xpCorrectedTotal = 0
    //     char.nbminTotal = 0
    //     for (skill of char.Skills) {
    //         for (act of skill.Activities) {
    //             let xpm = 
    //             act.correctedXph = act.xph / xpm
    //             act.correctedDeltaxp = act.deltaxp / xpm
    //             act.nbmin = (act.endtime - act.starttime) / 1000 / 60
    //             char.xpCorrectedTotal = char.xpCorrectedTotal + act.correctedDeltaxp
    //             char.nbminTotal = char.nbminTotal + act.nbmin
    //         }
    //     }
    //     char.avgPace = (char.xpCorrectedTotal / 1e6) / (char.nbminTotal / 60)
    // }

    // x.sort((a, b) => b.xpCorrectedTotal - a.xpCorrectedTotal)[0]
    // x = x.sort((a, b) => b.avgPace - a.avgPace).filter(x => x.nbminTotal > 100)

    // console.timeEnd("a")
    // //console.log(JSON.stringify(x[0], null, 4), x.length);

    // //console.log(d.getDate(), d.getMonth(), d.getFullYear())




    // //console.dir(x[0], { depth: null })

    // const getSdrForChar = (char, date) => {
    //     let xpCorrectedTotal = 0
    //     let nbminTotal = 0
    //     for (skill of char.Skills) {
    //         // filtrer la bonne date
    //         let activities = skill.Activities.filter(act => {
    //             return act.starttime.getFullYear() === date.getFullYear() &&
    //                 act.starttime.getDate() === date.getDate() &&
    //                 act.starttime.getMonth() === date.getMonth();
    //         })
    //         if (activities.length > 0) {
    //             for (act of activities) {
    //                 let xpm = xpMulti(82, act.lvl)
    //                 act.correctedXph = act.xph / xpm
    //                 act.correctedDeltaxp = act.deltaxp / xpm
    //                 act.nbmin = (act.endtime - act.starttime) / 1000 / 60
    //                 xpCorrectedTotal = xpCorrectedTotal + act.correctedDeltaxp
    //                 nbminTotal = nbminTotal + act.nbmin
    //             }
    //         }
    //     }
    //     let avgPace = (xpCorrectedTotal / 1e6) / (nbminTotal / 60)
    //     if (avgPace) {
    //         return {
    //             avgPace,
    //             xpCorrectedTotal,
    //             nbminTotal
    //         }
    //     } else {
    //         return null
    //     }
    // }


    // let res = []
    // let d = new Date()
    // for (let i = 0; i < 30; i++) {
    //     //let y = x.filter(x => x)
    //     let dd = new Date(d - 1000 * 60 * 60 * 24 * i)

    //     let tmpdata = []
    //     for (char of x) {
    //         let tmp = getSdrForChar(char, dd)

    //         if (tmp) {
    //             tmp.charName = char.charName
    //             tmp.accName = char.accName
    //             tmpdata.push(tmp)
    //         } 
    //     }

    //     res.push(
    //         {
    //             date: dd,
    //             data: tmpdata
    //         }
    //     )

    //     console.dir(res, {depth: null})



    // }


}

main();

