"use strict";const a=require("path"),e=require("read-each-line-sync"),l=e=>/\".*\"|\'.*\'/.test(e),u=e=>/true|false/.test(e),s=e=>!isNaN(Number(e)),g=e=>/^(_|\$|[A-z])(_|\$|[A-z]|[0-9]?)+$/.test(e),f=e=>{switch(e){case"+":case"-":case"*":case"/":case"%":case"**":case"!":case"=":return!0;default:return!1}},d=e=>{switch(e){case"if":case"else":case"def":case":":case",":case"end":return!0;default:return!1}},y=(new Map).set("-h","list all commands and help").set("-d","generate docs from code").set("-s","show the code as interpreted");var h=!0,c=1,t=[],n="",v=!1;const b=[{name:"+",type:"operator",argCount:2,action:t=>(t.forEach((e,a)=>{t[a]=r(t[a])}),"string"==t[0].type||"string"==t[1].type?o(t[0].value+t[1].value):p(String(t[0].value+t[1].value)))},{name:"-",type:"operator",argCount:2,action:t=>(t.forEach((e,a)=>{t[a]=r(t[a])}),p(String(t[0].value-t[1].value)))},{name:"*",type:"operator",argCount:2,action:t=>(t.forEach((e,a)=>{t[a]=r(t[a])}),p(String(t[0].value*t[1].value)))},{name:"/",type:"operator",argCount:2,action:t=>(t.forEach((e,a)=>{t[a]=r(t[a])}),p(String(t[0].value/t[1].value)))},{name:"%",type:"operator",argCount:2,action:t=>(t.forEach((e,a)=>{t[a]=r(t[a])}),p(String(t[0].value%t[1].value)))},{name:"**",type:"operator",argCount:2,action:t=>(t.forEach((e,a)=>{t[a]=r(t[a])}),p(String(t[0].value**t[1].value)))},{name:"!",type:"operator",argCount:1,action:t=>(t.forEach((e,a)=>{t[a]=r(t[a])}),"boolean"===t[0].type?p(String(!t[0].value)):p(String(-t[0].value)))},{name:"=",type:"operator",argCount:2,action:a=>{if(m.some(e=>e.name===a[0].value)){const t={name:a[0].value,type:"variable",object:r(a[1])};return m=m.map(e=>e.name===a[0].value?t:e),t.object}throw`"${a[0].value}" is not a variable
 at line `+c}}];var m=[{name:"test",type:"variable",object:{type:"string",value:"test"}},{name:"import",type:"function",args:["..."],argCount:1/0,action:e=>(e.forEach(e=>{"string"==e.type?i(a.join(a.dirname(n),e.value)):"name"==e.type&&i(a.join("/libs",e.value+".lab"))}),{type:"void",value:"void"})},{name:"print",type:"function",args:["object"],argCount:1,action:e=>(e[0]=r(e[0]),console.log(e[0].value),e[0])},{name:"prints",type:"function",args:["..."],argCount:1/0,action:e=>(e.forEach((e,a)=>{console.log(r(e).value)}),{type:"void",value:"void"})},{name:"var",type:"function",args:["variable","object"],argCount:2,action:e=>{e={name:e[0].value,type:"variable",object:r(e[1])};return m.push(e),e.object}},{name:"drop",type:"function",args:["variable"],argCount:1,action:a=>{if(m.some(e=>e.name===a[0].value))return m.splice(m.findIndex(e=>e.name===a[0].value),1),{type:"void",value:"void"};throw`"${a[0].value}" is not a variable
 at line `+c}},{name:"void",type:"function",args:["object"],argCount:1,action:()=>({type:"void",value:"void"})},{name:"voidI",type:"function",args:["..."],argCount:1/0,action:()=>({type:"void",value:"void"})},{name:"stringTo",type:"function",args:[".object"],argCount:1,action:e=>(e[0]=r(e[0]),o(e[0].value))}];function o(e){return{type:"string",value:String(e)}}function r(a){var e;return"name"===a.type&&m.some(e=>e.name===a.value)?"variable"==(null==(e=m.find(e=>e.name===a.value))?void 0:e.type)?null==e?void 0:e.object:p("<function>"):"name"!==a.type||m.some(e=>e.name===a.value)?a:{type:"undefined",value:"undefined"}}function p(e){if(l(e))return{type:"string",value:e.slice(1,e.length-1)};if(u(e))return{type:"boolean",value:"true"===e};if(s(e))return{type:"number",value:Number(e)};if(f(e))return{type:"operator",value:e};if(d(e))return{type:"custom",value:e};if(g(e))return{type:"name",value:e};throw`Unknown type at line ${c}, argument `+e}function E(e){e=Array.from(e.match(/(\".*?\"|\'.*?\'|\S)+/g)),t=[],e.forEach((e,a)=>{t[a]=p(e)});const a=t;var t,n;if(!0===v&&0<a.length&&(e=a,n="",e.forEach(e=>{switch(e.type){case"name":n+=` [94m${e.value}[0m`;break;case"custom":n+=` [34m${e.value}[0m`;break;case"operator":n+=` [91m${e.value}[0m`;break;case"number":n+=` [33m${e.value}[0m`;break;case"boolean":n+=` [32m${e.value}[0m`;break;case"string":n+=` [96m"${e.value}"[0m`;break;case"undefined":n+=` [97m${e.value}[0m`;break;case"void":n+=""}}),""!=n&&console.log(`[90m${c}[0m`+n)),!0===h&&"custom"!==a[0].type)for(var o=0,r={last:NaN,times:0};o<a.length;){const i=a.length-(o+1),l=a[i];if("name"===l.type&&m.some(e=>e.name===l.value)){const u=m.find(e=>e.name===l.value);"function"===(null===u||void 0===u?void 0:u.type)?"function"==typeof(null===u||void 0===u?void 0:u.action)&&(a.splice(i,(null===u||void 0===u?void 0:u.argCount)+1,null===u||void 0===u?void 0:u.action(a.slice(1+i,i+(null===u||void 0===u?void 0:u.argCount)+1))),o=0):o++}else if("operator"===l.type){const s=b.find(e=>e.name===l.value);void 0!==s&&(a.splice(i,s.argCount+1,s.action(a.slice(1+i,1+i+s.argCount))),o=0)}else"void"===l.type?(a.splice(i,1),o=0):o++;if(r.last===o?r.times++:r.times=0,r.last=o,100<r.times)throw"Failed to Evaluate at"+o}}function i(a){try{1==v&&console.log(`
from "${a}"
`),e(a,"utf8",e=>{/\S+/.test(e)&&!e.startsWith("//")&&E(e),t.includes(a)&&c++}),1==v&&console.log("\n")}catch(e){console.log(e)}}if(!(2<process.argv.length))throw console.error('No argument\nEnter "node lambda.js -h" to get help'),"Evaluation Failed";{const C=process.argv.slice(2);if(C.forEach(e=>{if(e.match(/.*\w\.lab/i))n=e.match(/.*\w\.lab/i)[0],t.push(n);else switch(e){case"-h":console.log("List of Arguments:"),y.forEach((e,a)=>{console.log(` ${a}: `+e)});break;case"-d":break;case"-s":v=!0;break;default:throw console.error("Bad argument\nEnter -h to see all possible arguments"),"Evaluation Failed"}}),!(0<t.length))throw console.error('No file argument\nEnter as "node lambda.js *lab"'),"Evaluation Failed";t.forEach(e=>{i(e)})}