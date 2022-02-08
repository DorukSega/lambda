const path = require('path'),
    readEachLineSync = require('read-each-line-sync')

var mainFile, isRun = false, genDoc = false, currentLine = 1;

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
        run: "-r",
        docs: "-d" //generates documentation
    },
    color: string => Object.assign(string, {
        title: "\x1b[33m" + string + "\x1b[0m",
        error: "\x1b[91m" + string + "\x1b[0m",
        code: "\x1b[93m" + string + "\x1b[0m"
    })
}

class lObject {
    constructor(data) {
        if (isVariable(data)) { // is variable
            const variable = varMap.get(data);
            this.type = variable.type;
            this.raw = variable.raw;
        } else if (!isNaN(data)) {
            const dataConverted = parseFloat(data);
            if (Number.isInteger(dataConverted)) {
                this.numType = "Integer";
                this.type = "Number";
                this.raw = dataConverted;
            } else {
                this.numType = "Float";
                this.type = "Number";
                this.raw = dataConverted;
            }
        } else if (isString(data)) {
            this.type = "String";
            this.raw = String(data.slice(1, data.length - 1));
        } else if (isBool(data)) {
            this.type = "Boolean";
            if (data == "true")
                this.raw = true;
            else
                this.raw = false;
        } else {
            throw `"${data}" is a unknown data type\n at line ${currentLine}`
        }
    }
}

const splitExecution = string => string.match(/(?=([^\"\']*(\"|\')[^\"\']*(\"|\'))*[^\"\']*$)(\S|\".*?\"|\'.*?\')+(?=([^\"\']*(\"|\')[^\"\']*(\"|\'))*[^\"\']*$)/g);

const varMap = new Map();
const funcMap = new Map();

const unvalids = [",", ":"]; // stuff you cant assign as a variable or function

const isVariable = name => varMap.has(name);
const isFunction = name => funcMap.has(name);
const isString = string => (string.startsWith("'") && string.endsWith("'")) || (string.startsWith('"') && string.endsWith('"'));
const isBool = str => str == "true" || str == "false";
const isValid = name => {
    if (!isFunction(name) && !unvalids.includes(name) && isNaN(name)) //change it to just unvalids maybe
        return true
    else
        return false
};

const typify = a => typeof (a) == "string" ? `"${a}"` : a;

const customSplitter = (args, splitAt) => {
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
}

function readData(data) { //reads data that is probably processed by compiler
    if (typeof data == "string") { //this means it is raw
        data = new lObject(data);
        return data.raw;
    } else { //this is a Number or Boolean
        return data;
    }
}

//hardcoded functions
funcMap.set(
    "print", //prints single value & works inline
    {
        argCount: 1,
        args: ["data"],
        action: ents => {
            console.log(readData(ents[0]));
            return typify(ents[0]); //returns inline
        }
    }
).set(
    "prints", //prints more than one value & won't work inline
    {
        argCount: Infinity,
        args: ["data"],
        action: ents => {
            ents.forEach(el => { //Might cause problems
                console.log(readData(el));
            });
            return ""; //DECIDE "" or typify(ents[0])
        }
    }
).set(
    "var",
    {
        argCount: 2,
        args: ["variable", "data"],
        action: ents => {
            if (isValid(ents[0])) {
                const assigned = ents[0];
                const assignee = new lObject(ents[1]);
                varMap.set(assigned, assignee);
                return typify(assignee.raw);
            } else {
                throw `"${ents[0]}" is not a valid entry\n at line ${currentLine}`
            }
        }
    }
).set(
    "drop",
    {
        argCount: 1,
        args: ["variable"],
        action: ents => {
            if (isVariable(ents[0])) {
                varMap.delete(ents[0]);
                return ""; //returns void for obv reasons
            } else {
                throw `"${ents[0]}" is not a variable\n at line ${currentLine}`
            }
        }
    }
).set(
    "import",
    {
        argCount: Infinity,
        args: ["lib"],
        action: ents => {
            ents.forEach(el => {
                if (isString(el)) { // > "library.lab"
                    const lib = new lObject(el);
                    compileCode(path.join(path.dirname(mainFile), lib.raw));
                } else { // > library
                    //base libraries
                    const lib = el;
                    compileCode(path.join("/libs", lib + ".lab")); //will reach from compiler location
                    //console.log("not yet implemented");
                }

            });
            return ""; //returns void for obv reasons
        }
    }
).set(
    "toString",
    {
        argCount: 1,
        args: ["data"],
        action: ents => {
            const data = new lObject(ents[0]);
            return `"${data.raw}"`;
        }
    }
).set(
    "+",
    {
        argCount: 2,
        args: ["first", "second"],
        action: ents => {
            const a = new lObject(ents[0]), b = new lObject(ents[1]);
            return typify(a.raw + b.raw);

        }
    }
).set(
    "-",
    {
        argCount: 2,
        args: ["first", "second"],
        action: ents => {
            const a = new lObject(ents[0]), b = new lObject(ents[1]);
            return typify(a.raw - b.raw);
        }
    }
).set(
    "/",
    {
        argCount: 2,
        args: ["first", "second"],
        action: ents => {
            const a = new lObject(ents[0]), b = new lObject(ents[1]);
            return typify(a.raw / b.raw);
        }
    }
).set(
    "*",
    {
        argCount: 2,
        args: ["first", "second"],
        action: ents => {
            const a = new lObject(ents[0]), b = new lObject(ents[1]);
            return typify(a.raw * b.raw);
        }
    }
).set(
    "%",
    {
        argCount: 2,
        args: ["first", "second"],
        action: ents => {
            const a = new lObject(ents[0]), b = new lObject(ents[1]);
            return typify(a.raw % b.raw);
        }
    }
).set(
    "**",
    {
        argCount: 2,
        args: ["first", "second"],
        action: ents => {
            const a = new lObject(ents[0]), b = new lObject(ents[1]);
            return typify(a.raw ** b.raw); // or write a loop
        }
    }
).set(
    "!", // negate
    {
        argCount: 1,
        args: ["value"],
        action: ents => {
            const a = new lObject(ents[0]);
            if (typeof (a) == "Boolean")
                return typify(!a.raw); // js specific
            else
                return typify(-a.raw)
        }
    }
).set(
    "=",
    {
        argCount: 2,
        args: ["first", "second"],
        action: ents => {
            const a = ents[0], b = new lObject(ents[1]);
            if (isVariable(a)) {
                varMap.set(a, b);
                return typify(b.raw); //returns the end result
            } else
                throw `"${a}" is not a variable\n at line ${currentLine}`
        }
    }
).set(
    "void",
    {
        argCount: 1,
        args: ["value"],
        action: () => { } //returns nothing
    }
).set(
    "voidI",
    {
        argCount: Infinity,
        args: ["value"],
        action: () => { } //returns nothing
    }
)

function evaluate(args) { //evaluates the given code
    args = !Array.isArray(args) ? [args] : args;
    for (let i = 0; i < args.length; i++) {
        const argsLast = args.length - 1; // index of last element 
        const revI = argsLast - i; // i but reversed, so 0 is last el
        const data = args[revI]; // data
        if (isFunction(data)) { // if split arguments with ","
            const func = funcMap.get(data); //function
            if (args[revI + func.argCount + 1] == ",") {
                const allArgs = customSplitter(args.slice(revI + 1), ",");
                for (let j = 0; j < allArgs.length; j++) {
                    const revJ = allArgs.length - 1 - j;
                    var iArgs = allArgs[revJ];
                    iArgs = iArgs.slice(0, func.argCount); //arguments used by function
                    var result;
                    if (func.action)
                        result = func.action(iArgs);
                    else {
                        var newCode = func.code;
                        func.args.forEach((e1, z) => {
                            newCode.forEach((e2, k) => {
                                newCode[k] = newCode[k] == e1 ? iArgs[z] : e2;
                            });
                        });
                        result = evaluate(newCode);
                    }
                    if (result != undefined)
                        args.splice(revI + revJ * (func.argCount + 1), func.argCount + 1, result); // replaces for each ,
                    else
                        args.splice(revI + revJ * (func.argCount + 1), func.argCount + 1); // replaces for each ,
                }
            } else { // if single
                const iArgs = args.slice(revI + 1, revI + 1 + func.argCount); // arguments used by function
                var result;
                if (func.action)
                    result = func.action(iArgs);
                else {
                    var newCode = func.code;
                    func.args.forEach((e1, z) => {
                        newCode.forEach((e2, k) => {
                            newCode[k] = newCode[k] == e1 ? iArgs[z] : e2;
                        });
                    });
                    result = evaluate(newCode);
                }
                if (result != undefined)
                    args.splice(revI, func.argCount + 1, result);
                else
                    args.splice(revI, func.argCount + 1);
            }
            i = -1; // goes back to end
        } else if (data == "def") {
            const argsNodefsplit = customSplitter(args.slice(0, revI), ":");
            const funcName = argsNodefsplit[0][0];
            if (!unvalids.includes(funcName) && isNaN(funcName)) {
                const newArgs = argsNodefsplit[0].slice(1);
                funcMap.set(funcName, {
                    argCount: newArgs.length,
                    args: newArgs,
                    code: argsNodefsplit[1]
                });
            }
            break;
        }
    }
    return args[0];
}

function compileCode(fileName) {
    try {
        readEachLineSync(path.join(__dirname, fileName), 'utf8', function (line) {
            if (/\S+/.test(line)) { // checks if not empty line
                var lineSplit = splitExecution(line);
                if (lineSplit.includes("//")) // this ignores comments
                    for (let i = 0; i < lineSplit.length; i++) {
                        if (lineSplit[i] == "//") {
                            lineSplit = lineSplit.slice(0, i);
                            break;
                        }
                    }
                if (fileName == mainFile && !line.startsWith("//") && /\S+/.test(line)) { console.log(compiler.color(`> ${lineSplit.join(" ")}`).code); }
                evaluate(lineSplit); //Most Important Moment 👀
            }
            if (fileName == mainFile) { currentLine++; }
        });
        if (genDoc) {
            const fs = require('fs')
            const logger = fs.createWriteStream('doc.txt', { flags: 'w' })
            logger.write("<FunctionName> : <arg1> <arg2> ...\n");
            funcMap.forEach((val, key) => {
                var argumenty = "";
                val.args.forEach(arg => argumenty += ` <${arg}> `);
                if (val.argCount == Infinity)
                    argumenty += " ... "
                logger.write("\n" + `${key} :` + argumenty);
            });
            logger.close();
        }
    } catch (err) {
        console.error(err);
    }
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
                case compiler.args.docs: //-d is triggered
                    genDoc = true;
                    break;
                default:
                    console.error(compiler.color("\nError Bad Argument:").error + ` ${arg}`)
                    break;
            }
        }
    });
    if (mainFile != undefined) {
        //compileCode(path.join("/libs", "main.lab")); //DECIDE always imported?
        compileCode(mainFile);

    } else {
        console.error(compiler.color("\nError No File Argument").error + "\nenter a file as " +
            compiler.color(`${compiler.name} ${lang.sName} ${compiler.fileMatch.code}`).code);
    }
} else {
    console.error(`${compiler.color("\nError Missing Arguments").error} 
    To learn more run ${compiler.color(`${compiler.name} ${lang.sName} ${compiler.args.help}`).code}`);
}