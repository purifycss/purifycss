import UglifyJS from "uglifyjs"
const fs = require("fs") // import fs from "fs"
import glob from "glob"

const compressCode = code => {
    try {
        let ast = UglifyJS.parse(code)
        ast.figure_out_scope()
        let compressor = UglifyJS.Compressor({ warnings: false })
        ast = ast.transform(compressor)
        ast.figure_out_scope()
        ast.compute_char_frequency()
        ast.mangle_names({ toplevel: true })
        code = ast.print_to_string().toLowerCase()
    } catch (e) {
        console.error(e.message)
    }
    return code.toLowerCase()
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
    return isContent ? compressCode(files) : files
}

export default {
    concatFiles,
    filesToSource,
    getFilesFromPatternArray
}
