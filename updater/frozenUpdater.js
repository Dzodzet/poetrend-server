const {updateFrozenList} = require("./procedures/updateFrozenList.js")


const main = async () => {
    const leagues = ["SSF Expedition HC", "SSF Expedition", "Hardcore Expedition"]//
    const rankRange = [1, 14999]

    for (let league of leagues) {
        await updateFrozenList(league, rankRange[0], rankRange[1])
        await new Promise((resolve) => {setTimeout(resolve, 5000)})
    }
}

main()