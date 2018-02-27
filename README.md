# Lint Everything ! [![Build Status](https://travis-ci.org/loicbourgois/linteverything.svg?branch=master)](https://travis-ci.org/loicbourgois/linteverything)
> One Linter to parse them all and in the darkness lint them.

## Usage

### In a npm script
First install the package with:
```bash
$ npm install linteverything
```
Then add a script to `package.json` :
```js
{
	...
	"scripts": {
		"linteverything": "linteverything"
	},
	...
}
```
Finally run the script:
```bash
$ npm run linteverything
```

### In a Travis CI script
Just add the following to `.travis.yml` :
```
script:
  - npm install linteverything
  - printf "module.exports={ignore:['node_modules','package-lock.json','.git','.travis.yml'],verbose:true};" > .linteverythingrc.js
  - node ./node_modules/linteverything/bin/linteverything.js
```

### In your code
First install the package with :
```bash
$ npm install linteverything --save-dev
```
Then add the following to your code :
```js
const linteverything = require('linteverything');
const options = {
	verbose:true
};
linteverything(options).then(function(result) {
	console.log(result);
});
```

## Options
Options are defined as javascript objects.

They can be set in 3 places:
- in the argument passed to `linteverything(options)` ;
- in `.linteverythingrc.js` ;
- in [`default-settings.js`](default-settings.js).

### failOnError
Default : `true`.

Boolean controlling how to exit.

If set to `true`, `linteverything` will exit with code `1`.

### ignore
Default : `[]`.

An array of files and folders to ignore. They will be ignored by every linters.

### linters
Default : all linters are enabled.
The following linters are supported:
- [checkstyle](https://github.com/checkstyle/checkstyle) ;
- [eslint](https://github.com/eslint/eslint) ;
- [htmllint](https://github.com/htmllint/htmllint).

### verbose
Default : `false`.

Boolean to enable or disable verbose logs.
