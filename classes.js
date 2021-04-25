function SkillOrder(league, starttime, endtime, minlvl, maxlvl){
    this.league = league
    this.starttime = starttime
    this.endtime = endtime
    this.minlvl = minlvl
    this.maxlvl = maxlvl
    
    // this.generateQueryForSkills = () => {
    //     console.log(this.endtime)
    //     return `SELECT 
    //     skill, SUM(nbmin) as nb
    //     FROM
    //     (
    //         SELECT 
    //             t1.charid,
    //             t1.endtime,
    //             TIMESTAMPDIFF(MINUTE,
    //                 t1.starttime,
    //                 t1.endtime) AS nbmin,
    //             t2.skill,
    //             t3.lvl,
    //             t3.league,
    //             t2.ATTIME,
    //             mat
    //         FROM
    //             poetrend2.activelist AS t1
    //                 INNER JOIN
    //             (SELECT 
    //                 *
    //             FROM
    //                 poetrend2.skills skills) AS t2
    //                 INNER JOIN
    //             poetrend2.frozenlist AS t3
    //                 INNER JOIN
    //             (SELECT 
    //                 charid, MAX(ATTIME) mat
    //             FROM
    //                 poetrend2.skills
    //             GROUP BY charid) AS t4 ON t1.charid = t2.charid
    //                 AND t2.charid = t3.charid
    //                 AND t1.endtime = t3.ATTIME
    //                 AND t1.charid = t4.charid
    //                 AND t2.ATTIME = t4.mat
    //         HAVING ATTIME < endtime) AS t
    //     where lvl >= ${this.minlvl}
    //     and lvl <= ${this.maxlvl}
    //     and league = "${this.league}"
    //     and TIMESTAMPDIFF(HOUR,endtime,now()) <= ${this.starttime}
    //     and TIMESTAMPDIFF(HOUR,endtime,now()) >= ${this.endtime}
    //     GROUP BY skill
    //     ORDER BY nb DESC
    //     `
    // }

    this.generateQueryForSkillsDetails = () => {
        let tmp = this.starttime*2
        return `SELECT 
                t1.charid,
                t1.endtime,
                TIMESTAMPDIFF(MINUTE,
                    t1.starttime,
                    t1.endtime) AS nbmin,
                t2.skill,
                t3.lvl,
                t3.league,
                t2.ATTIME,
                mat
            FROM
                poetrend2.activelist AS t1
                    INNER JOIN
                (SELECT 
                    *
                FROM
                    poetrend2.skills skills) AS t2
                    INNER JOIN
                poetrend2.frozenlist AS t3
                    INNER JOIN
                (SELECT 
                    charid, MAX(ATTIME) mat
                FROM
                    poetrend2.skills
                GROUP BY charid) AS t4 ON t1.charid = t2.charid
                    AND t2.charid = t3.charid
                    AND t1.endtime = t3.ATTIME
                    AND t1.charid = t4.charid
                    AND t2.ATTIME = t4.mat
            HAVING ATTIME < endtime
            and lvl >= ${this.minlvl}
        and lvl <= ${this.maxlvl}
        and league = "${this.league}"
        and TIMESTAMPDIFF(HOUR,endtime,now()) <= ${tmp}
        and TIMESTAMPDIFF(HOUR,endtime,now()) >= ${this.endtime}`
    }
};

module.exports = { SkillOrder }