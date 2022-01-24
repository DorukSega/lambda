const fs = require('fs'),
    path = require('path'),
    readline = require('readline');;

//console.log(process.argv);
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
    })
}

const varMap = new Map();

const c = {
    includeTimes: (a, b) => a.replaceAll(RegExp("[^" + b + "]", "g"), "").length,
    isEquation: a => !!a.match(/(?<!=)=(?!=)/g),
    splitEquation: a => a.split(/(?<!=)=(?!=)/g),
    getLastPar: a => [a.slice(a.lastIndexOf('(') + 1).slice(0, a.slice(a.lastIndexOf('(') + 1).indexOf(")")).replaceAll(" ", ''), a.lastIndexOf('('), a.lastIndexOf('(') + 1 + a.slice(a.lastIndexOf('(') + 1).indexOf(")")],
    replaceBetween: (str, start, end, to) => str.substring(0, start) + to + str.substring(end),
    getVar: str => varMap.get(str.trim()) ? parseFloat(varMap.get(str.trim())) : console.log(compiler.color("\nError Bad Variable Name: ").error + str.trim()),
    isOperation: a => a.match(/([-+/*%])/) ? true : false,
    isFunction: a => a.match(/[\S]*\(.*\)/) ? true : false,
    isVariable: a => a.match(/[a-zA-Z_$][a-zA-Z_$0-9]*/) ? true : false
}
const compilerFunctions = {
    print: { args: 1, exc: a => console.log(evalOps(a)) }
}
var fileName, isRun = false;

if (process.argv.length > 2) {
    const args = process.argv.slice(2); //all the arguments
    //evaluates args
    args.forEach(arg => {
        if (arg.match(compiler.fileMatch.regex)) {
            fileName = arg.match(compiler.fileMatch.regex)[0];
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
    if (fileName != undefined) {
        compileCode();
    } else {
        console.error(compiler.color("\nError No File Argument").error + "\nenter a file as " +
            compiler.color(`${compiler.name} ${lang.sName} ${compiler.fileMatch.code}`).code);
    }
} else {
    console.error(`${compiler.color("\nError Missing Arguments").error} 
    To learn more run ${compiler.color(`${compiler.name} ${lang.sName} ${compiler.args.help}`).code}`);
}



function evalMath(code) {
    var match = code.split(/([-+/*%])/);
    var index = 1;
    match.forEach((element, index) => {
        if (!element) {
            match[index + 2] = match[index + 1] + match[index + 2];
            match.splice(index, 2);
        }
    });
    while (match.length > 1) {
        const x = parseFloat(match[index - 1]) ? parseFloat(match[index - 1]) : c.getVar(match[index - 1]);
        const y = parseFloat(match[index + 1]) ? parseFloat(match[index + 1]) : c.getVar(match[index + 1]);
        switch (match[index]) {
            case "*":
            case "/":
            case "%":
                switch (match[index]) {
                    case "*":
                        match[index + 1] = x * y;
                        match.splice(index - 1, 2);
                        break;
                    case "/":
                        match[index + 1] = x / y;
                        match.splice(index - 1, 2);
                        break;
                    case "%":
                        match[index + 1] = x % y;
                        match.splice(index - 1, 2);
                        break;
                }
                break;
            case "+":
            case "-":
                if (match.includes("*") || match.includes("/") || match.includes("%")) {
                    index += 2;
                } else {
                    switch (match[index]) {
                        case "-":
                            match[index + 1] = x - y;
                            match.splice(index - 1, 2);
                            break;
                        case "+":
                            match[index + 1] = x + y;
                            match.splice(index - 1, 2);
                            break;
                    }
                }
                break;
            default:
                index = 1;
                break;
        }
    }
    return parseFloat(match[0]);
}

function evalOps(code) {
    if (c.isOperation(code)) {
        if (code.includes("(")) {
            while (c.getLastPar(code)[1] != -1) {
                const parLast = c.getLastPar(code);
                const cont = parLast[0];
                const fIndex = parLast[1];
                const lIndex = parLast[2];
                code = c.replaceBetween(code, fIndex, lIndex, evalMath(cont));

            }
        }
        return evalMath(code);
    } else if (c.isVariable(code)) {
        return c.getVar(code.trim());
    } else {
        return parseFloat(code);
    }
}

function compileCode() { //will return end result
    try {
        const rl = readline.createInterface({
            input: fs.createReadStream(path.join(__dirname, fileName)),
            crlfDelay: Infinity
        });

        rl.on('line', (line) => {
            console.log(`> ${line}`);

            if (c.isEquation(line)) { //if line is a equation 
                const eq = c.splitEquation(line);
                const val = eq[eq.length - 1];
                eq.pop();
                //console.log(eq)
                eq.forEach(varName => {
                    varMap.set(varName.trim(), evalOps(val));
                });
                //console.log(varMap);
            } else if (c.isFunction(line)) {
                const functionName = line.match(/([\S]*\(.*\))/g)[0].split("(")[0];
                const parDat = line.match(/([\S]*\(.*\))/g)[0].split("(")[1].replace(")", "").split(",");
                //console.log(functionName);
                //console.log(parDat[0]);
                //console.log(compilerFunctions[functionName].args > 1)
                if (compilerFunctions[functionName].args > 1) {
                    compilerFunctions[functionName].exc(parDat)
                } else {
                    compilerFunctions[functionName].exc(parDat[0])
                }
            }
        });

    } catch (err) {
        console.error(err);
    }

}