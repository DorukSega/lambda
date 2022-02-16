const path = require('path'),
    readEachLineSync = require('read-each-line-sync');

// Validates from string to Lambda Type
const validLString: Function = (obj: string): boolean => /\".*\"|\'.*\'/.test(obj), //catches any string "" or ''
    validLBoolean: Function = (obj: string): boolean => /true|false/.test(obj),
    validLNumber: Function = (obj: string): boolean => !isNaN(Number(obj)),
    validLName: Function = (obj: string): boolean => /^(_|\$|[A-z])(_|\$|[A-z]|[0-9]?)+$/.test(obj),
    validLOperator: Function = (obj: string): boolean => {
        switch (obj) { //add more here as you add more operators
            case '+':
            case '-':
            case '*':
            case '/':
            case '%':
            case '**':
            case '!':
            case '=':
                return true;
            default:
                return false;
        }
    },
    validLCustom: Function = (obj: string): boolean => {
        switch (obj) {
            case "if":
            case "else":
            case "def":
            case ":":
            case ",":
            case "end":
                return true;
            default:
                return false;
        }
    };

const compArguments = new Map().set(
    "-h", "list all commands and help"
).set(
    "-d", "generate docs from code"
).set(
    "-s", "show the code as interpreted"
)

// if false it will not eval until <end>
var runningStatus: boolean = true,
    currentLine: number = 1,
    mainFiles: string[] = [],
    isShow: boolean = false,
    genDoc: boolean = false;

//Object
interface LObject {
    type: string,
    value: any, //part that is returned
}

//variable that will be stored
interface LVariable {
    name: string,
    type: "variable",
    object: LObject, //part that is returned
}

interface LFunction { //Function
    name: string,
    type: "function",
    args: string[],
    argCount: number,
    action: Function | string //part that is ran, HARDCODED if Function, INTERPRETED if string
}

interface LOperator { //Operator, ie + - * / ...
    name: string,
    type: "operator",
    argCount: number,
    action: Function //part that is ran, HARDCODED if Function, INTERPRETED if string
}

const operators: LOperator[] = [{
    name: "+",
    type: "operator",
    argCount: 2,
    action: (ents: LObject[]) => {

        ents.forEach((el: LObject, i: number) => {
            ents[i] = vLObject(ents[i]);
        });
        if (ents[0].type == "string" || ents[1].type == "string") //if either one is string, turns it to string
            return stringify(ents[0].value + ents[1].value);
        else
            return typifyLsingle(String(ents[0].value + ents[1].value));
    }
},
{
    name: "-",
    type: "operator",
    argCount: 2,
    action: (ents: LObject[]) => {
        ents.forEach((el: LObject, i: number) => {
            ents[i] = vLObject(ents[i]);
        });
        return typifyLsingle(String(ents[0].value - ents[1].value));
    }
},
{
    name: "*",
    type: "operator",
    argCount: 2,
    action: (ents: LObject[]) => {
        ents.forEach((el: LObject, i: number) => {
            ents[i] = vLObject(ents[i]);
        });
        return typifyLsingle(String(ents[0].value * ents[1].value));
    }
},
{
    name: "/",
    type: "operator",
    argCount: 2,
    action: (ents: LObject[]) => {
        ents.forEach((el: LObject, i: number) => {
            ents[i] = vLObject(ents[i]);
        });
        return typifyLsingle(String(ents[0].value / ents[1].value));
    }
},
{
    name: "%",
    type: "operator",
    argCount: 2,
    action: (ents: LObject[]) => {
        ents.forEach((el: LObject, i: number) => {
            ents[i] = vLObject(ents[i]);
        });
        return typifyLsingle(String(ents[0].value % ents[1].value));
    }
},
{
    name: "**",
    type: "operator",
    argCount: 2,
    action: (ents: LObject[]) => {
        ents.forEach((el: LObject, i: number) => {
            ents[i] = vLObject(ents[i]);
        });
        return typifyLsingle(String(ents[0].value ** ents[1].value));
    }
},
{
    name: "!",
    type: "operator",
    argCount: 1,
    action: (ents: LObject[]) => {
        ents.forEach((el: LObject, i: number) => {
            ents[i] = vLObject(ents[i]);
        });
        if (ents[0].type === "boolean")
            return typifyLsingle(String(!ents[0].value)); // js specific
        else
            return typifyLsingle(String(-ents[0].value))
    }
},
{
    name: "=",
    type: "operator",
    argCount: 2,
    action: (ents: LObject[]) => {
        if (storedObjects.some(el => el.name === ents[0].value)) {
            const newVar: LVariable = {
                name: ents[0].value,
                type: "variable",
                object: vLObject(ents[1])
            };
            storedObjects = storedObjects.map(el => el.name === ents[0].value ? newVar : el)
            return newVar.object;
        } else
            throw `"${ents[0].value}" is not a variable\n at line ${currentLine}`
    }
},
]

//Map that contains all the Variables in Storage
var storedObjects: Array<LVariable | LFunction> = [{
    name: "test",
    type: "variable",
    object: { type: "string", value: "test" }
},
{
    name: "import",
    type: "function",
    args: ["..."],
    argCount: Infinity,
    action: (ents: LObject[]) => {
        ents.forEach(lib => {
            if (lib.type == "string") { // > "library.lab"
                readEvalFile(path.join(path.dirname(mainFiles), lib.value));
            } else if (lib.type == "name") { // > library , will apply to ValidLName ruleset
                //base libraries
                readEvalFile(path.join("/libs", lib.value + ".lab")); //will reach from compiler location
            }
        });
        return {
            type: "void",
            value: "void"
        }; //returns void for obv reasons
    }
},
{
    name: "print",
    type: "function",
    args: ["object"],
    argCount: 1,
    action: (ents: LObject[]) => {
        ents[0] = vLObject(ents[0]);
        console.log(ents[0].value)
        return ents[0];
    }
},
{
    name: "prints",
    type: "function",
    args: ["..."],
    argCount: Infinity,
    action: (ents: LObject[]) => {
        ents.forEach((el: LObject, i: number) => {
            console.log(vLObject(el).value)
        });
        return {
            type: "void",
            value: "void"
        };
    }
},
{
    name: "var",
    type: "function",
    args: ["variable", "object"],
    argCount: 2,
    action: (ents: LObject[]) => {
        const newVar: LVariable = {
            name: ents[0].value,
            type: "variable",
            object: vLObject(ents[1])
        };
        storedObjects.push(newVar)
        return newVar.object;
    }
},
{
    name: "drop",
    type: "function",
    args: ["variable"],
    argCount: 1,
    action: (ents: LObject[]) => {
        if (storedObjects.some(el => el.name === ents[0].value)) {
            storedObjects.splice(storedObjects.findIndex(el => el.name === ents[0].value), 1)
            return {
                type: "void",
                value: "void"
            };
        } else {
            throw `"${ents[0].value}" is not a variable\n at line ${currentLine}`
        }
    }
},
{
    name: "void",
    type: "function",
    args: ["object"],
    argCount: 1,
    action: () => {
        return {
            type: "void",
            value: "void"
        };
    }
},
{
    name: "voidI",
    type: "function",
    args: ["..."],
    argCount: Infinity,
    action: () => {
        return {
            type: "void",
            value: "void"
        };
    }
},
{
    name: "stringTo",
    type: "function",
    args: [".object"],
    argCount: 1,
    action: (ents: LObject[]) => {
        ents[0] = vLObject(ents[0]);
        return stringify(ents[0].value)
    }
}
]

function stringify(string: any): LObject {
    return {
        type: "string",
        value: String(string)
    }
}



function vLObject(obj: LObject): LObject { //checks if it is variable and returns as variable if so
    if (obj.type === "name" && storedObjects.some(el => el.name === obj.value)) {
        const named = storedObjects.find(el => el.name === obj.value);
        if (named?.type == "variable") {
            return named?.object;
        } else {
            return typifyLsingle("<function>"); //returns a function string
        }
    } else if (obj.type === "name" && !storedObjects.some(el => el.name === obj.value)) {
        return {
            type: "undefined",
            value: "undefined"
        }
    } else {
        return obj;
    }
}

function parseLline(line: string): string[] { //parses line to object array
    return Array.from(line.match(/(\".*?\"|\'.*?\'|\S)+/g)!);
}

function typifyLsingle(obj: string): LObject { //typfies single el
    if (validLString(obj)) {
        return {
            type: "string",
            value: obj.slice(1, obj.length - 1)
        }
    } else if (validLBoolean(obj)) {
        return {
            type: "boolean",
            value: obj === "true" ? true : false
        }
    } else if (validLNumber(obj)) {
        return {
            type: "number",
            value: Number(obj)
        }
    } else if (validLOperator(obj)) {
        return {
            type: "operator",
            value: obj
        }
    } else if (validLCustom(obj)) {
        return {
            type: "custom",
            value: obj
        }
    } else if (validLName(obj)) {
        return {
            type: "name",
            value: obj
        }
    } else { //maybe this should return undefined
        throw `Unknown type at line ${currentLine}, argument ${obj}`;
    }

}
function typifyLline(parsedLine: string[]): Array<LObject> { //typifies the given parsedLine
    var typedLline: Array<LObject> = [];
    parsedLine.forEach((obj: string, i: number) => {
        typedLline[i] = typifyLsingle(obj);
    });
    return typedLline;
}

function evalLline(line: string): any {
    const typedLline: LObject[] = typifyLline(parseLline(line));
    if (isShow === true && typedLline.length > 0)
        printTypedLine(typedLline);
    if (runningStatus === true) { // has not come across a if with false
        if (typedLline[0].type === "custom") { //custom ops

        } else { //normal ops
            var i: number = 0, errorChance = { last: NaN, times: 0 };
            while (i < typedLline.length) {
                const revI: number = typedLline.length - (i + 1), //reverse index
                    cur: LObject = typedLline[revI] //current obj

                if (cur.type === "name" && storedObjects.some(el => el.name === cur.value)) { //if it is name and exists
                    const named = storedObjects.find(el => el.name === cur.value);
                    switch (named?.type) {
                        case "function":
                            switch (typeof (named?.action)) {
                                case "function":
                                    typedLline.splice(revI, named?.argCount + 1, named?.action(typedLline.slice(revI + 1, revI + named?.argCount + 1)));
                                    i = 0;
                                    break;
                                case "string":
                                    //typedLline.splice(revI, 1, named?.action );
                                    break;
                            }

                            break;
                        default: //name is variable
                            i++;
                            break;

                    }
                } else if (cur.type === "operator") { //applies operator
                    const operand = operators.find(el => el.name === cur.value);
                    if (operand !== undefined)
                        typedLline.splice(revI, operand.argCount + 1, operand.action(typedLline.slice(revI + 1, revI + 1 + operand.argCount))),
                            i = 0;
                } else if (cur.type === "void") { //clears void
                    typedLline.splice(revI, 1);
                    i = 0;
                } else {
                    i++;
                }
                if (errorChance.last === i)
                    errorChance.times++;
                else
                    errorChance.times = 0;
                errorChance.last = i;
                if (errorChance.times > 100)
                    throw "Failed to Evaluate at" + i;

            }
        }
    } else { //look for else or end otherwise do nothing

    }
    //console.log(storedObjects)
}


//evalLline("print + * 2 3 5")

function readEvalFile(fileName: string) {
    try {
        const filePath: string = path.join(__dirname, fileName);
        if (isShow == true)
            console.log(`\nfrom file:///${filePath}\n`)
        readEachLineSync(filePath, 'utf8', (line: string) => {
            if (/\S+/.test(line) && !line.startsWith("//")) { // checks if not empty line
                evalLline(line); //Most Important Moment 👀
            }
            if (mainFiles.includes(fileName))
                currentLine++;
        });
        if (isShow == true)
            console.log("\n");
    } catch (error) {
        console.log(error)
    }
}

function printTypedLine(typedLline: LObject[]): void { //prints the damn thing
    var endResult = "";
    typedLline.forEach(el => {
        switch (el.type) {
            case "name":
                endResult += ` \x1b[94m${el.value}\x1b[0m`
                break;
            case "custom":
                endResult += ` \x1b[34m${el.value}\x1b[0m`
                break;
            case "operator":
                endResult += ` \x1b[91m${el.value}\x1b[0m`
                break;
            case "number":
                endResult += ` \x1b[33m${el.value}\x1b[0m`
                break;
            case "boolean":
                endResult += ` \x1b[32m${el.value}\x1b[0m`
                break;
            case "string":
                endResult += ` \x1b[96m"${el.value}"\x1b[0m`
                break;
            case "undefined":
                endResult += ` \x1b[97m${el.value}\x1b[0m`
                break;
            case "void":
                endResult += ""
                break;
        }

    });
    if (endResult != "")
        console.log(`\x1b[90m${currentLine}\x1b[0m` + endResult);
}


if (process.argv.length > 2) {
    const args = process.argv.slice(2); //all the arguments
    //evaluates args
    args.forEach(arg => {
        if (arg.match(/.*\w\.lab/i)) { //is file
            mainFiles.push(arg.match(/.*\w\.lab/i)![0]);
        } else {
            switch (arg) {
                case "-h": //-h is triggered
                    console.log("List of Arguments:");
                    compArguments.forEach((val, key) => {
                        console.log(` ${key}: ${val}`);
                    });
                    break;
                case "-d": //-d is triggered
                    genDoc = true;
                    break;
                case "-s": //-s is triggered
                    isShow = true;
                    break;
                default:
                    console.error("Bad argument\nEnter -h to see all possible arguments")
                    throw "Evaluation Failed";
            }
        }
    });
    if (mainFiles.length > 0) {
        //compileCode(path.join("/libs", "main.lab")); //DECIDE always imported?
        //compileCode(mainFile);
        mainFiles.forEach(file => {
            readEvalFile(file)
        });
    } else {
        console.error("No file argument\nEnter as \"node lambda.js *lab\"");
        throw "Evaluation Failed";
    }
} else {
    console.error("No argument\nEnter \"node lambda.js -h\" to get help");
    throw "Evaluation Failed";
}