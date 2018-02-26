'use strict';
const {promisify} = require('util');
const fs = require('fs');
const chalk = require('chalk');
const readdir = promisify(fs.readdir);
const htmllint = require('htmllint');

const SEVERITY_NONE = 0;
const SEVERITY_WARNING = 1;
const SEVERITY_ERROR = 2;

let results = [];


async function lintFolder(options) {
	if(pathMatchIgnore(options.workingFolder, options)){
		return;
	}
	if(options.verbose){
		console.log(`linting ${options.workingFolder}`);
	}
	const files = await readdir(options.workingFolder);
	for (let file of files) {
		let options_ = Object.assign({}, options);
		file = options_.workingFolder + '/' + file;
		if(fs.lstatSync(file).isDirectory()) {
			options_.workingFolder = file;
			await lintFolder(options_);
		} else if (fs.lstatSync(file).isFile()) {
			options_.workingFile = file;
			await lintFile(options_);
		}
	}
}


const lintFile = async function(options) {
	if(pathMatchIgnore(options.workingFile, options)){
		return;
	}
	if(options.verbose){
		console.log(`\tlinting ${options.workingFile}`);
	}
	const fileContent = fs.readFileSync(options.workingFile, 'utf-8');
	const lines = fileContent.split('\n');
	let number = 0;
	lines.forEach(function(line) {
		number++;
		lintLine(line, number, options);
	});
	if(
		options.linters
		&& options.linters.htmllint
		&& options.linters.htmllint.extensions.includes(options.workingFile.split('.').pop())
	) {
		if(options.verbose){
			console.log(`\t${chalk.blue('htmllint')} ${options.workingFile}`);
		}
		await htmllint(fileContent, options.linters.htmllint.settings).then(function(out) {
			out.forEach(function(e){
				addResult(options.workingFile, lines[e.line-1], e.line, `htmllint-${e.code}`, e.rule, SEVERITY_ERROR);
			});
		});
	}
};


const lintLine = function(line, number, options) {
	let i = 1;
	lintIndetation(line, number, options, i++, 'no-space-indent');
	lintTralingSpaces(line, number, options, i++, 'no-trailing-space');
};


const lintIndetation = function(line, number, options, errorCode, errorString) {
	let regex = /^([\t]*)([ ]+)/g;
	let r = regex.exec(line);
	if(r) {
		addResult(options.workingFile, line, number, errorCode, errorString, SEVERITY_WARNING);
	}
};


const lintTralingSpaces = function(line, number, options, errorCode, errorString) {
	let regex = /([ \t]+)$/g;
	let r = regex.exec(line);
	if(r) {
		addResult(options.workingFile, line, number, errorCode, errorString, SEVERITY_ERROR);
	}
};


const addResult = function(path, line, lineNumber, errorCode, errorString, severity) {
	results.push({
		path: path,
		line: line,
		lineNumber: lineNumber,
		error: errorCode,
		severity: severity
	});
	if(severity === SEVERITY_NONE) {
		console.log(`${path}\n  l.${lineNumber}\t${('log')}\t${errorCode}-${errorString}`);
	} if(severity === SEVERITY_ERROR) {
		console.log(`${path}\n  l.${lineNumber}\t${chalk.red('error')}\t${errorCode}-${errorString}`);
	} else if(severity === SEVERITY_WARNING) {
		console.log(`${path}\n  l.${lineNumber}\t${chalk.yellow('warning')}\t${errorCode}-${errorString}`);
	}
};


const pathMatchIgnore = function(path, options) {
	let b = false;
	options.ignore.forEach(function(path_) {
		if(path === `${options.rootFolder}/${path_}`) {
			b = true;
		}
	});
	return b;
};


async function linteverything (options) {
	options = options||{};
	options.ignore = options.ignore || [];
	options.rootFolder = options.rootFolder||process.cwd();
	options.workingFolder
		= options.workingFolder || options.rootFolder || process.cwd();
	options.linters = options.linters||{};
	options.linters.htmllint = options.linters.htmllint||{};
	let htmllintrc = {};
	try {
		htmllintrc = require(process.cwd() + '/.htmllintrc');
	} catch (e) {
		if (e.code !== 'MODULE_NOT_FOUND') {
			throw e;
		}
	}
	options.linters.htmllint.settings = Object.assign(
		{},
		options.linters.htmllint.settings,
		htmllintrc
	);

	if(options.linters && options.linters.eslint) {
		let CLIEngine = require('eslint').CLIEngine;
		let cli = new CLIEngine({useEslintrc: true});
		let report = cli.executeOnFiles(['./']);
		report.results.forEach(function(result){
			result.messages.forEach(function(message){
				addResult(result.filePath, message.source, message.line, 'eslint', message.ruleId, message.severity);
			});
		});
	}

	await lintFolder(options);
}


async function main(options) {
	let linteverythingrc = {};
	try {
		linteverythingrc = require(process.cwd() + '/.linteverythingrc');
	} catch (e) {
		if (e.code !== 'MODULE_NOT_FOUND') {
			throw e;
		}
	}
	options = Object.assign({}, linteverythingrc, options, require('./default-settings'));
	if(options.verbose) {
		console.log(`Lint everything with options: ${JSON.stringify(options, null, 2)}`);
	}
	await linteverything(options);
	let warnCount = results.filter(function(r){
		return (r.severity === SEVERITY_WARNING);
	}).length;
	let errorCount = results.filter(function(r){
		return (r.severity === SEVERITY_ERROR);
	}).length;
	if(!errorCount && !warnCount) {
		console.log(chalk.green('Success'));
	} else {
		if(warnCount) {
			console.log(chalk.yellow(`${warnCount} warnings`));
		}
		if(errorCount) {
			console.log(chalk.red(`${errorCount} errors`));
			process.exit(1);
		}
	}
	return {
		results: results,
		options: options
	};
}


exports = module.exports = main;
