const fs = require('fs');
const file = 'src/pages/ClientApp/index.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldStr = `                                       className="bg-slate-50/50 rounded-2xl hover:bg-slate-100 hover:shadow-md transition-all group flex flex-col justify-start items-center text-center overflow-hidden border border-slate-100 hover:border-blue-200 pb-3"`;
const newStr = `                                       className="bg-transparent hover:bg-slate-50/80 rounded-3xl hover:shadow-sm transition-all group flex flex-col justify-start items-center text-center p-3 border border-transparent hover:border-slate-100"`;

const oldStr2 = `<div className="w-full aspect-square bg-slate-100 mb-3 relative overflow-hidden shrink-0">`;
const newStr2 = `<div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-100 mb-3 relative overflow-hidden shrink-0 shadow-sm border border-slate-200 flex items-center justify-center">`;

content = content.replace(oldStr, newStr);
content = content.replace(oldStr2, newStr2);

fs.writeFileSync(file, content, 'utf8');
