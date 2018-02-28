'use strict';
const {promisify} = require('util');
const fs = require('fs');
const chalk = require('chalk');
const readdir = promisify(fs.readdir);
const htmllint = require('htmllint');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const parseString = require('xml2js').parseString;
const stylelint = require('stylelint');

const SEVERITY_NONE = 0;
const SEVERITY_WARNING = 1;
const SEVERITY_ERROR = 2;
const SUPER_VERBOSE = 2;

let results = [];
let lintersLog = {};


async function lintFolder(options) {
	if(pathMatchIgnore(options.workingFolder, options)){
		return;
	}
	if(options.verbose){
		console.log(chalk.cyan('linteverything') + ' ' + options.workingFolder);
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
	if(pathMatchIgnoreExtension(options.workingFile, options)) {
		return;
	}
	if(options.verbose){
		console.log(`\t${chalk.cyan('linteverything')} ${options.workingFile}`);
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
		addResult('linteverything', options.workingFile, line, number, errorCode, errorString, SEVERITY_WARNING);
	}
};


const lintTralingSpaces = function(line, number, options, errorCode, errorString) {
	let regex = /([ \t]+)$/g;
	let r = regex.exec(line);
	if(r) {
		addResult('linteverything', options.workingFile, line, number, errorCode, errorString, SEVERITY_ERROR);
	}
};


const addResult = function(linter, path, line, lineNumber, errorCode, errorString, severity) {
	if(!['linteverything', 'eslint', 'checkstyle', 'htmllint', 'stylelint'].includes(linter)) {
		throw new Error(`${linter} is not a valid linter`);
	}
	results.push({
		linter: linter,
		path: path,
		line: line,
		lineNumber: lineNumber,
		error: errorCode,
		errorString: errorString,
		severity: severity
	});
	if(severity === SEVERITY_NONE) {
		console.log(`${path}\n  l.${lineNumber}\t${(linter + ' log')}\t${errorString}`);
	} if(severity === SEVERITY_ERROR) {
		console.log(`${path}\n  l.${lineNumber}\t${chalk.red(linter + ' error')}\t${errorString}`);
	} else if(severity === SEVERITY_WARNING) {
		console.log(`${path}\n  l.${lineNumber}\t${chalk.yellow(linter + ' warning')}\t${errorString}`);
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


const pathMatchIgnoreExtension = function(path, options) {
	return options.ignoreExtensions.includes(path.split('.').pop());
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
		if(options.verbose){
			console.log(chalk.blue('eslint') + ' ' + options.workingFolder);
		}
		let CLIEngine = require('eslint').CLIEngine;
		const useEslintrc = fs.existsSync(process.cwd() + '/.eslintrc.js');
		let eslintOptions = options.linters.eslint.settings;
		if(useEslintrc) {
			eslintOptions = {
				useEslintrc: useEslintrc
			};
		}
		let cli = new CLIEngine(eslintOptions);
		let report = cli.executeOnFiles(['./']);
		report.results.forEach(function(result){
			result.messages.forEach(function(message){
				addResult('eslint', result.filePath, message.source, message.line, 'eslint', message.ruleId, message.severity);
			});
		});
	}

	if(options.linters && options.linters.checkstyle) {
		if(options.verbose){
			console.log(chalk.blue('checkstyle') + ' ' + options.workingFolder);
		}
		const jar = `${__dirname}/../linters/checkstyle-8.8-all.jar`;
		const conf = `${__dirname}/../linters/checkstyle.config.xml`;
		const {stdout, stderr} = await exec(`java -jar ${jar} ${options.workingFolder} -c ${conf} -f xml`);
		if(options.verbose === SUPER_VERBOSE){
			console.log(chalk.blue('checkstyle stdout')+'\n', stdout);
			console.log(chalk.blue('checkstyle stderr')+'\n', stderr);
		}
		parseString(stdout, function (err, result) {
			lintersLog.checkStyle = {
				stdout:stdout,
				stderr:stderr,
				parsedStdout:result
			};
			result.checkstyle.file.forEach(function(file){
				if(!file.error) {
					return;
				}
				file.error.forEach(function(error) {
					addResult('checkstyle', file.$.name, '', error.$.line, 'checkstyle', error.$.source.split('.').pop(), SEVERITY_ERROR);
				});
			});
		});
	}

	if(options.linters && options.linters.stylelint) {
		if(options.verbose){
			console.log(chalk.blue('stylelint') + ' ' + options.workingFolder);
		}
		await stylelint.lint({
			config: options.linters.stylelint.settings,
			files: options.workingFolder + '/**/*.css'
		})
			.then(function(data) {
				data.results.forEach(function(result) {
					if(result.warnings) {
						result.warnings.forEach(function(warning) {
							addResult(
								'stylelint',
								result.source,
								'',
								warning.line,
								'stylelint-' + warning.rule,
								warning.rule/*warning.text*/,
								SEVERITY_ERROR
							);
						});
					}
				});
			})
			.catch(function(err) {
				throw err;
			});
	}

	await lintFolder(options);
}


async function main(options) {
	let linteverythingrc = {};
	let return_ = {};
	try {
		linteverythingrc = require(process.cwd() + '/.linteverythingrc');
	} catch (e) {
		if (e.code !== 'MODULE_NOT_FOUND') {
			throw e;
		}
	}
	options = Object.assign({}, require('./default-settings'), linteverythingrc, options);
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
	return_ = {
		results: results,
		options: options,
		linters: lintersLog
	};
	if(options.verbose === SUPER_VERBOSE) {
		console.log(JSON.stringify(return_, null, 2));
	}
	if(!errorCount && !warnCount) {
		console.log(chalk.green('Success'));
	} else {
		if(warnCount) {
			console.log(chalk.yellow(`${warnCount} warnings`));
		}
		if(errorCount) {
			console.log(chalk.red(`${errorCount} errors`));
			if(options.failOnError) {
				process.exit(1);
			}
		}
	}
	return return_;
}


exports = module.exports = main;
