import { EventEmitter } from "events"
import rework from "rework"

const RULE_TYPE = "rule"
const MEDIA_TYPE = "media"

class CssTreeWalker extends EventEmitter {
    constructor(code, plugins) {
        super()
        this.startingSource = code
        this.ast = null
        plugins.forEach(plugin => {
            plugin.initialize(this)
        })
    }

    beginReading() {
        this.ast = rework(this.startingSource).use(this.readPlugin.bind(this))
    }

    readPlugin(tree) {
        this.readRules(tree.rules)
        this.removeEmptyRules(tree.rules)
    }

    readRules(rules) {
        for (let rule of rules) {
            if (rule.type === RULE_TYPE) {
                this.emit("readRule", rule.selectors, rule)
            }
            if (rule.type === MEDIA_TYPE) {
                this.readRules(rule.rules)
            }
        }
    }

    removeEmptyRules(rules) {
        let emptyRules = []

        for (let rule of rules) {
            const ruleType = rule.type

            if (ruleType === RULE_TYPE && rule.selectors.length === 0) {
                emptyRules.push(rule)
            }
            if (ruleType === MEDIA_TYPE) {
                this.removeEmptyRules(rule.rules)
                if (rule.rules.length === 0) {
                    emptyRules.push(rule)
                }
            }
        }

        emptyRules.forEach(emptyRule => {
            const index = rules.indexOf(emptyRule)
            rules.splice(index, 1)
        })
    }

    toString() {
        if (this.ast) {
            return this.ast.toString().replace(/,\n/g, ",")
        }
        return ""
    }
}

export default CssTreeWalker
