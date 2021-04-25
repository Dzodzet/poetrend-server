const request = require('request');

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function ladderLoop(minRank, maxRank, league) {
    console.log(`About to request data from ${league} league ranging from rank ${minRank} to ${maxRank}`)

    let JSONladder = []
    let i = 0
    let params = {}
    let numberOfRequestsToRun = Math.trunc((maxRank - minRank) / 200) + 1
    let numberOfBulkToRun = Math.trunc((numberOfRequestsToRun - 1) / 5) + 1
    
    // Request loop
    for (j = 0; j < numberOfBulkToRun; j++) { // J = BULK
        console.log("**********  In bulk #", j + 1, ' out of ', Math.trunc((numberOfRequestsToRun - 1) / 5) + 1, " **********")
        let promiseArray = []
        let requestsLeft = 5
        let t1 = new Date().getTime();
        for (i; i < numberOfRequestsToRun; i++) { // I = REQUEST
            if (requestsLeft === 0) { break; }
            console.log('Request #', i + 1, "/", numberOfRequestsToRun);
            params = {
                league,
                "offset": (minRank - 1) + i * 200,
                "limit": Math.min(15000 - (minRank - 1) + i * 200, 200, maxRank - ((minRank - 1) + i * 200))
            }
            promiseArray = promiseArray.concat(getJSONLadder(params));
            requestsLeft--;
        }
        let bulkData = await Promise.all(promiseArray).then(data => data.flat());
        JSONladder.push(bulkData);

        var t2 = new Date().getTime()
        if (j + 1 !== numberOfBulkToRun) {
            let timeToSleep = Math.max(0, 5000 - (t2 - t1))
            console.log('Took ', t2 - t1, ' ms. Sleeping for ', timeToSleep, ' ms');
            await sleep(timeToSleep);
        }
    }
    JSONladder = JSONladder.flat();
    console.log("All data collected ! Number of rows = ", JSONladder.length)
    return JSONladder;
}

function getJSONLadder(params) {
    const base_url = "https://api.pathofexile.com/ladders/"
    let url = encodeURI(base_url + params.league + "?offset=" + params.offset + "&limit=" + params.limit);
    //console.log(url);
    return new Promise((resolve, reject) => {
        request(url, (error, response, body) => {
            if (error) reject(error);
            if (response.statusCode != 200) {
                reject('Invalid status code <' + response.statusCode + '>');
            }
            let ladderpage = JSON.parse(body)
            if ("cached_since" in ladderpage) {
                let csince = ladderpage.cached_since;
                let characters = ladderpage.entries;
                characters.entries.cached_since = csince;
                resolve(characters);
            } else {
                resolve([]);
            }
        });
    });
}

function getJSONchar(charName, accName) {
    let url = encodeURI("https://www.pathofexile.com/character-window/get-items?accountName=" + accName + "&character=" + charName)
    console.log("NEW REQUEST ==================> Account name = ", accName, ". Character name = ", charName);
    return new Promise((resolve, reject) => {
        request(url, (error, response, body) => {
            if (error) reject(error);
            // if (response.statusCode != 200) {
            //     reject('Invalid status code <' + response.statusCode + '>');
            // }
            resolve(JSON.parse(body));
        });
    });
}

module.exports = { ladderLoop, getJSONLadder, getJSONchar }