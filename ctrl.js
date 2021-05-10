// Imports

const { Character, Skill, Activity } = require('./sql.js')
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
        where: { 'starttime': { [Op.gt]: requestDateTime.getTime() - 1000*60*60*24*nbDays  } },
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



module.exports = {
    getSkills
};