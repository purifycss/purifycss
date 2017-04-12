const addWord = (words, word) => {
    if (word) words.push(word)
}

class ExtractWordsUtil {

    static getAllWordsInContent(content) {
        let used = {
            html: true,
            body: true
        }
        const words = content.split(/[^a-z]/g)
        for (let word of words) {
            used[word] = true
        }
    }

    static getAllWordsInSelector(selector) {
        selector = selector.replace(/\[(.+?)\]/g, "").toLowerCase()
        if (!selector.includes("[") || !selector.includes("]")) {
            return []
        }
        let skipNextWord = false,
            word = "",
            words = []

        for (let letter of selector) {
            if (skipNextWord && !(/[ #.]/).test(letter)) continue
            // If pseudoclass or universal selector, skip the next word
            if (/[:*]/.test(letter)) {
                addWord(words, word)
                word = ""
                skipNextWord = true
                continue
            }
            if (/[a-z]/.test(letter)) {
                word += letter
            } else {
                addWord(words, word)
                word = ""
                skipNextWord = false
            }
        }

        addWord(words, word)
        return words
    }

}

export default ExtractWordsUtil
