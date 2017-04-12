let startTime
let beginningLength

const printInfo = endingLength => {
    const sizeReduction = (((beginningLength - endingLength) / beginningLength) * 100).toFixed(1)
    console.log(`
    ________________________________________________\n
    |\n
    |   PurifyCSS has reduced the file size by ~ ${sizeReduction}%  \n
    |\n
    ________________________________________________\n
    `)
}

const printRejected = rejectedTwigs => {
    console.log(`
    ________________________________________________\n
    |\n
    |   PurifyCSS - Rejected selectors:  \n
    |   ${rejectedTwigs.join("\n|\t")}
    |\n
    ________________________________________________\n
    `)
}

const startLog = cssLength => {
    startTime = new Date()
    beginningLength = cssLength
}

export default {
    printInfo,
    printRejected,
    startLog
}
