const {updateSkills} = require("./procedures/updateSkills")


const main = async () => {
    const leagues = ["SSF Expedition HC", "SSF Expedition", "Hardcore Expedition"]//
    const rankRange = [1, 14999]

    for (let league of leagues) {
        await updateSkills(league, rankRange[0], rankRange[1])
        await new Promise((resolve) => {setTimeout(resolve, 5000)})
    }
}

main()