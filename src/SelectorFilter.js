import { getAllWordsInSelector } from "./utils/ExtractWordsUtil"

const isWildcardWhitelistSelector = selector => {
    return selector[0] === "*" && selector[selector.length - 1] === "*"
}

const hasWhitelistMatch = (selector, whitelist) => {
    for (let el of whitelist) {
        if (selector.includes(el)) return true
    }
    return false
}

class SelectorFilter {
    constructor(contentWords, whitelist) {
        this.contentWords = contentWords
        this.rejectedSelectors = []
        this.wildcardWhitelist = []
        this.parseWhitelist(whitelist)
    }

    initialize(CssSyntaxTree) {
        CssSyntaxTree.on("readRule", this.parseRule.bind(this))
    }

    parseWhitelist(whitelist) {
        whitelist.forEach(whitelistSelector => {
            whitelistSelector = whitelistSelector.toLowerCase()

            if (isWildcardWhitelistSelector(whitelistSelector)) {
                // If '*button*' then push 'button' onto list.
                this.wildcardWhitelist.push(
                    whitelistSelector.substr(1, whitelistSelector.length - 2)
                )
            } else {
                getAllWordsInSelector(whitelistSelector).forEach(word => {
                    this.contentWords[word] = true
                })
            }
        })
    }

    parseRule(selectors, rule) {
        rule.selectors = this.filterSelectors(selectors)
    }

    filterSelectors(selectors) {
        let contentWords = this.contentWords,
            rejectedSelectors = this.rejectedSelectors,
            wildcardWhitelist = this.wildcardWhitelist,
            usedSelectors = []

        selectors.forEach(selector => {
            if (hasWhitelistMatch(selector, wildcardWhitelist)) {
                usedSelectors.push(selector)
                return
            }
            let words = getAllWordsInSelector(selector),
                usedWords = words.filter(word => contentWords[word])

            if (usedWords.length === words.length) {
                usedSelectors.push(selector)
            } else {
                rejectedSelectors.push(selector)
            }
        })

        return usedSelectors
    }
}

export default SelectorFilter
