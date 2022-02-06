const path = require('path'),
    readEachLineSync = require('read-each-line-sync')

var mainFile, isRun = false;


const lang = {
    name: "Lambda",
    sName: "lambda"
}

const compiler = {
    name: "node",
    fileMatch: {
        code: "*.lab",
        regex: /.*\w\.lab/i
    },
    args: {
        help: "-h",
        run: "-r"
    },
    color: string => Object.assign(string, {
        title: "\x1b[33m" + string + "\x1b[0m",
        error: "\x1b[91m" + string + "\x1b[0m",
        code: "\x1b[93m" + string + "\x1b[0m"
    }),
    splitExecution: string => string.split(/\s+/),
    isOperand: string => {
        switch (string) {
            case "+":
            case "-":
            case "/":
            case "*":
            case "%":
            case "(":
            case ")":
            case "**":
            case "+=":
            case "-=":
            case "*=":
            case "/=":
            case "%=":
            case "**=":
            case "==":
            case "!=":
            case ">":
            case ">=":
            case "<":
            case "<=":
            case "++":
            case "--":
            case "&&":
            case "||":
            case "!":
            case "?":
            case ":":
            case ",":
            case "true":
            case "false":
            case '"':
            case "'":
            case ".":
                return true;
            default:
                return false;
        }
    },
    isString: string => (string.startsWith("'") && string.endsWith("'")) || (string.startsWith('"') && string.endsWith('"')),
    isComment: string => (string.startsWith("//")),
    argSplitter: args => {
        for (var i = 0, inArr = [], result = []; i < args.length; i++) {
            if (args[i] != ",") { //true is number
                inArr.push(args[i]);
            } else {
                result.push(inArr);
                inArr = [];
            }
        }
        result.push(inArr);
        return result;
    },
    customSplitter: (args, splitAt) => {
        for (var i = 0, inArr = [], result = []; i < args.length; i++) {
            if (args[i] != splitAt) { //true is number
                inArr.push(args[i]);
            } else {
                result.push(inArr);
                inArr = [];
            }
        }
        result.push(inArr);
        return result;
    },
    eval: args => {
        args = !Array.isArray(args) ? [args] : args;
        if (compiler.isString(args.join(""))) {
            return args.join("").substring(1, args.join("").length - 1);
        } else {
            args.forEach((arg, i) => {
                if (!compiler.isOperand(arg) && isNaN(arg) && !compiler.isString(arg)) { //checks if variable
                    if (varMap.has(arg)) {
                        args[i] = varMap.get(arg)
                    } else {
                        throw `Variable ${arg} is undefined`
                    }
                }
            })
            return eval(args.join("")); //use something other than eval()
        }
    }
}

const varMap = new Map();

const h = { // hardcoded
    import: args => args.forEach(innArr => {
        if (compiler.isString(innArr[0])) {
            const loc = innArr.substring(1, innArr.length - 1);
            compileCode(path.join(path.dirname(mainFile), loc));
        } else {
            //maybe base libraries here?
            const loc = innArr;
            compileCode(path.join("/libs", loc + ".lab"));
            //console.log("not yet implemented");
        }
    }),
    print: args => compiler.argSplitter(args).forEach(innArr => {
        console.log(compiler.eval(innArr));
    }),
    var: args => compiler.argSplitter(args).forEach(innArr => {
        varMap.set(innArr[0], compiler.eval(innArr.splice(1)));
    }),
    /*addTo: args => compiler.argSplitter(args).forEach(innArr => {
        varMap.set(innArr[0], compiler.eval(varMap.get(innArr[0])) + compiler.eval(innArr.splice(1)));
    }),*/
    drop: args => compiler.argSplitter(args).forEach(innArr => {
        varMap.delete(innArr[0]);
    }),
    toString: args => compiler.argSplitter(args).forEach(innArr => {
        if (!isNaN(varMap.get(innArr[0]))) {
            varMap.set(innArr[0], `"${varMap.get(innArr[0])}"`)
        }
    }),
    def: args => compiler.argSplitter(args).forEach(innArr => {
        const funcName = innArr[0];
        const rest = compiler.customSplitter(innArr.splice(1), ":");
        rest[0].forEach((funcArg, i) => {
            rest[1].forEach((el, j) => {
                rest[1][j] = el == funcArg ? `args.arg${i}` : el
            });
        });
        const funcOper = rest[1].join("");
        varMap.set(funcName, eval(`args=>${funcOper}`));
    }),
    call: args => compiler.argSplitter(args).forEach(innArr => {
        const funcName = innArr[0];
        const rest = compiler.customSplitter(innArr.splice(1), ":");
        const funcAssign = rest[0].join("");
        var argies = {}
        rest[1].forEach((funcArg, i) => {
            Object.defineProperty(argies, `arg${i}`, { value: compiler.eval(funcArg) });
        });
        varMap.set(funcAssign, varMap.get(funcName)(argies));
    }),
}


if (process.argv.length > 2) {
    const args = process.argv.slice(2); //all the arguments
    //evaluates args
    args.forEach(arg => {
        if (arg.match(compiler.fileMatch.regex)) {
            mainFile = arg.match(compiler.fileMatch.regex)[0];
        } else {
            switch (arg) {
                case compiler.args.help: //-h is triggered
                    console.log(compiler.color("List of Arguments:").title);
                    Object.entries(compiler.args).forEach(arg => {
                        console.log(" " + arg[0] + ": " + compiler.color(arg[1]).code);
                    });
                    break;
                case compiler.args.run: //-r is triggered
                    isRun = true;
                    break;
                default:
                    console.error(compiler.color("\nError Bad Argument:").error + ` ${arg}`)
                    break;
            }
        }
    });
    if (mainFile != undefined) {
        compileCode(path.join("/libs", "main.lab")); //always imported?
        compileCode(mainFile);
    } else {
        console.error(compiler.color("\nError No File Argument").error + "\nenter a file as " +
            compiler.color(`${compiler.name} ${lang.sName} ${compiler.fileMatch.code}`).code);
    }
} else {
    console.error(`${compiler.color("\nError Missing Arguments").error} 
    To learn more run ${compiler.color(`${compiler.name} ${lang.sName} ${compiler.args.help}`).code}`);
}

function compileCode(fileName) {
    try {
        readEachLineSync(path.join(__dirname, fileName), 'utf8', function (line) {
            if (fileName == mainFile && !compiler.isComment(line)) { console.log(compiler.color(`> ${line}`).code); }
            if (/\S+/.test(line) && !compiler.isComment(line)) { //checks if not empty line
                const lineSplit = compiler.splitExecution(line);
                const action = lineSplit[0];
                h[action](lineSplit.splice(1));
            }
        })
    } catch (err) {
        console.error(err);
    }
}
