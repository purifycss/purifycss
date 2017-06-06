const fs = require("fs")
const purify = require("../lib/purifycss.js")
const absPath = `${__dirname}/test_examples/`
const read = path => fs.readFileSync(absPath + path, "utf8")

describe("find intact classes", () => {
    const content = read("simple/simple.js"),
        css = read("simple/simple.css"),
        result = purify(content, css)

    it("finds .single", () => {
        expect(result.includes(".single") === true).toBe(true)
    })

    it("finds .double-class", () => {
        expect(result.includes(".double-class") === true).toBe(true)
    })

    it("can find .triple-simple-class", () => {
        expect(result.includes(".triple-simple-class") === true).toBe(true)
    })
})

describe("callback", () => {
    const content = read("simple/simple.js"),
        css = read("simple/simple.css")

    it("can use a callback", () => {
        purify(content, css, result => {
            expect(result.includes(".triple-simple-class") === true).toBe(true)
        })
    })
})

describe("classes that are added together", () => {
    const content = read("combined/combined.js"),
        css = read("combined/combined.css"),
        result = purify(content, css)

    it("can find .added-together", () => {
        expect(result.includes(".added-together") === true).toBe(true)
    })

    it("can find .array-joined", () => {
        expect(result.includes(".array-joined") === true).toBe(true)
    })
})

describe("filters out unused selectors", () => {
    const content = read("remove_unused/remove_unused.js"),
        css = read("remove_unused/remove_unused.css"),
        result = purify(content, css)

    it("contains .used-class", () => {
        expect(result.includes(".used-class") === true).toBe(true)
    })

    it("removes .unused-class", () => {
        expect(result.includes(".unused-class") === false).toBe(true)
    })

    it("removes .another-one-not-found", () => {
        expect(result.includes(".another-one-not-found") === false).toBe(true)
    })
})

describe("works with multiple files", () => {
    const content = ["**/test_examples/multiple_files/*.+(js|html)"],
        css = ["**/test_examples/multiple_files/*.css"],
        result = purify(content, css)

    it("finds .taylor-swift", () => {
        expect(result.includes(".taylor-swift") === true).toBe(true)
    })

    it("finds .blank-space", () => {
        expect(result.includes(".blank-space") === true).toBe(true)
    })

    it("removes .shake-it-off", () => {
        expect(result.includes(".shake-it-off") === false).toBe(true)
    })
})

describe("camelCase", () => {
    const content = read("camel_case/camel_case.js"),
        css = read("camel_case/camel_case.css"),
        result = purify(content, css)

    it("finds testFoo", () => {
        expect(result.includes("testFoo") === true).toBe(true)
    })

    it("finds camelCase", () => {
        expect(result.includes("camelCase") === true).toBe(true)
    })
})

describe("wildcard", () => {
    const content = read("wildcard/wildcard.html"),
        css = read("wildcard/wildcard.css"),
        result = purify(content, css)

    it("finds universal selector", () => {
        expect(result.includes("*") === true).toBe(true)
    })

    it("finds :before", () => {
        expect(result.includes("before") === true).toBe(true)
    })

    it("finds scrollbar", () => {
        expect(result.includes("scrollbar") === true).toBe(true)
    })

    it("finds selection", () => {
        expect(result.includes("selection") === true).toBe(true)
    })

    it("finds vertical", () => {
        expect(result.includes("vertical") === true).toBe(true)
    })

    it("finds :root", () => {
        expect(result.includes(":root") === true).toBe(true)
    })
})

describe("media queries", () => {
    const content = read("media_queries/media_queries.html"),
        css = read("media_queries/media_queries.css"),
        result = purify(content, css)

    it("finds .media-class", () => {
        expect(result.includes(".media-class") === true).toBe(true)
    })

    it("finds .alone", () => {
        expect(result.includes(".alone") === true).toBe(true)
    })

    it("finds #id-in-media", () => {
        expect(result.includes("#id-in-media") === true).toBe(true)
    })

    it("finds body", () => {
        expect(result.includes("body") === true).toBe(true)
    })

    it("removes .unused-class", () => {
        expect(result.includes(".unused-class") === true).toBe(false)
    })

    it("removes the empty media query", () => {
        expect(result.includes("66666px") === true).toBe(false)
    })
})

describe("attribute selectors", () => {
    const content = read("attribute_selector/attribute_selector.html"),
        css = read("attribute_selector/attribute_selector.css"),
        result = purify(content, css)

    it("finds font-icon-", () => {
        expect(result.includes("font-icon-") === true).toBe(true)
    })

    it("finds center aligned", () => {
        expect(result.includes("center aligned") === true).toBe(true)
    })

    it("does not find github", () => {
        expect(result.includes("github") === true).toBe(false)
    })
})

describe("special characters", () => {
    const content = read("special_characters/special_characters.js"),
        css = read("special_characters/special_characters.css"),
        result = purify(content, css)

    it("finds @home", () => {
        expect(result.includes("@home") === true).toBe(true)
    })

    it("finds +rounded", () => {
        expect(result.includes("+rounded") === true).toBe(true)
    })

    it("finds button", () => {
        expect(result.includes("button") === true).toBe(true)
    })
})

describe("delimited", () => {
    const content = read("delimited/delimited.html"),
        css = read("delimited/delimited.css"),
        result = purify(content, css)

    it("removes the extra comma", () => {
        var commaCount = result.split("").reduce(
            (total, chr) => {
                if (chr === ",") {
                    return total + 1
                }

                return total
            },
            0
        )

        expect(commaCount).toBe(1)
    })

    it("finds h1", () => {
        expect(result.includes("h1") === true).toBe(true)
    })

    it("finds p", () => {
        expect(result.includes("p") === true).toBe(true)
    })

    it("removes .unused-class-name", () => {
        expect(result.includes(".unused-class-name") === false).toBe(true)
    })
})

describe("removal of selectors", () => {
    beforeEach(() => {
        this.css = read("bootstrap/modified-bootstrap.css")
    })

    it("should only have .testFoo", () => {
        var css = this.css + read("camel_case/camel_case.css")
        var result = purify("testfoo", css)

        expect(result.length < 400).toBe(true)
        expect(result.includes(".testFoo") === true).toBe(true)
    })
})

describe("pseudo classes", () => {
    const content = read("pseudo_class/pseudo_class.js"),
        css = read("pseudo_class/pseudo_class.css"),
        result = purify(content, css)

    it("finds div:before", () => {
        expect(result.includes("div:before") === true).toBe(true)
    })

    it("removes row:after", () => {
        expect(result.includes("row:after") === true).toBe(false)
    })
})
