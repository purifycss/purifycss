let startTime
let beginningLength

const printInfo = endingLength => {
    const sizeReduction = (((beginningLength - endingLength) / beginningLength) * 100).toFixed(1)
    console.log(`
    ________________________________________________
    |
    |   PurifyCSS has reduced the file size by ~ ${sizeReduction}%  
    |
    ________________________________________________
    `)
}

const printRejected = rejectedTwigs => {
    console.log(`
    ________________________________________________
    |
    |   PurifyCSS - Rejected selectors:  
    |   ${rejectedTwigs.join("\n    |\t")}
    |
    ________________________________________________
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
