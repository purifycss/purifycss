import resolve from "rollup-plugin-node-resolve"
import commonjs from "rollup-plugin-commonjs"
import babel from "rollup-plugin-babel"

export default {
    entry: "src/purifycss.js",
    targets: [
        {
            dest: "lib/purifycss.es.js",
            format: "es"
        },
        {
            dest: "lib/purifycss.js",
            format: "cjs"
        }
    ],
    plugins: [
        resolve(),
        commonjs(),
        babel({ exclude: "node_modules/**" })
    ],
    sourceMap: false
}
