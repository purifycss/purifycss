const UglifyJS = require("uglify-js")
const fs = require("fs")
import glob from "glob"
import { prepack } from "prepack"

const compressCode = code => {
    let compressedCode = code
    try {
        const prepackedCode = prepack(code).code
        compressedCode = UglifyJS.minify(prepackedCode).code
    } catch (e) {
        // If compression fails, assume it's not a JS file and return the full code.
    }
    return compressedCode.toLowerCase()
}

export const concatFiles = (files, options) =>
    files.reduce((total, file) => {
        let code = ""
        try {
            code = fs.readFileSync(file, "utf8")
            code = options.compress ? compressCode(code) : code
        } catch (e) {
            console.warn(e.message)
        }
        return `${total}${code} `
    }, "")

export const getFilesFromPatternArray = fileArray => {
    let sourceFiles = {}
    for (let string of fileArray) {
        try {
            // See if string is a filepath, not a file pattern.
            fs.statSync(string)
            sourceFiles[string] = true
        } catch (e) {
            const files = glob.sync(string)
            files.forEach(file => {
                sourceFiles[file] = true
            })
        }
    }
    return Object.keys(sourceFiles)
}

export const filesToSource = (files, type) => {
    const isContent = type === "content"
    const options = { compress: isContent }
    if (Array.isArray(files)) {
        files = getFilesFromPatternArray(files)
        return concatFiles(files, options)
    }
    // 'files' is already a source string.
    return isContent ? compressCode(files) : files
}

export default {
    concatFiles,
    filesToSource,
    getFilesFromPatternArray
}
