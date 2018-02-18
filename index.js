'use strict'
const {promisify} = require('util');
const fs = require('fs');
const readline = require('readline');
const chalk = require('chalk');
const readdir = promisify(fs.readdir);

const SEVERITY_NONE = 0;
const SEVERITY_WARNING = 1;
const SEVERITY_ERROR = 2;

let results = [];


async function lintFolder(options) {
	if(pathMatchIgnore(options.workingFolder, options)) {
		return;
	}
	const files = await readdir(options.workingFolder);
	for (let file of files) {
		let options_ = Object.assign({}, options);
		file = options_.workingFolder+'/'+file
		if(fs.lstatSync(file).isDirectory()) {
			options_.workingFolder = file;
			await lintFolder(options_);
		} else if (fs.lstatSync(file).isFile()) {
			options_.workingFile = file;
			lintFile(options_)
		} else {
		}
	}
}


const lintFile = function(options) {
	if(pathMatchIgnore(options.workingFile, options)) {
		return;
	}
	const lines = fs.readFileSync(options.workingFile, 'utf-8')
		.split('\n');
	let number = 0;
	lines.forEach(function(line) {
		number++;
		lintLine(line, number, options);
	});
}


const lintLine = function(line, number, options) {
	let i = 1;
	lintIndetation(line, number, options, i++, 'no-space-indent');
	lintTralingSpaces(line, number, options, i++, 'no-trailing-space');
}


const lintIndetation = function(line, number, options, errorCode, errorString) {
	let regex = /^([\t]*)([ ]+)/g;
	let r = regex.exec(line);
	if(r) {
		addResult(options.workingFile, line, number, errorCode, errorString, SEVERITY_WARNING);
	}
}


const lintTralingSpaces = function(line, number, options, errorCode, errorString) {
	let regex = /([ \t]+)$/g;
	let r = regex.exec(line);
	if(r) {
		addResult(options.workingFile, line, number, errorCode, errorString, SEVERITY_ERROR);
	}
}


const addResult = function(path, line, lineNumber, errorCode, errorString, severity) {
	results.push({
		path: path,
		line: line,
		lineNumber: lineNumber,
		error: errorCode,
		severity: severity
	});
	if(severity === SEVERITY_ERROR) {
		console.log(`${path}\n  l.${lineNumber}\t${chalk.red('error')}\t${errorCode}-${errorString}`);
	} else if(severity === SEVERITY_WARNING) {
		console.log(`${path}\n  l.${lineNumber}\t${chalk.yellow('warning')}\t${errorCode}-${errorString}`);
	}
}


const pathMatchIgnore = function(path, options) {
	let b = false;
	options.ignore.forEach(function(path_) {
		if(path === `${options.rootFolder}/${path_}`) {
			b = true;
		}
	});
	return b;
}


async function linteverything (options) {
	options = options || {};
	options.ignore = [];
	options.rootFolder = options.rootFolder || process.cwd();
	options.workingFolder
		= options.workingFolder || options.rootFolder || process.cwd();
	options.ignore.push('node_modules', 'package-lock.json', '.git', '.travis.yml');
	await lintFolder(options);
}


async function main() {
	await linteverything();
	let warnCount = results.filter(function(r){
		return (r.severity === SEVERITY_WARNING);
	}).length;
	let errorCount = results.filter(function(r){
		return (r.severity === SEVERITY_ERROR);
	}).length;
	if(!errorCount && !warnCount) {
		console.log(chalk.green('Success'))
	} else {
		if(warnCount) {
			console.log(chalk.yellow(`${warnCount} warnings`));
		}
		if(errorCount) {
			console.log(chalk.red(`${errorCount} errors`));
			process.exit(1);
		}
	}
	process.exit(0);
}


main();
exports = module.exports = linteverything;
