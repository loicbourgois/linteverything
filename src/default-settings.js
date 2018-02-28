module.exports = {
	failOnError: true,
	ignore: [],
	ignoreExtensions: [
		'jar', 'pdf'
	],
	linters: {
		checkstyle: true,
		eslint: {
			settings :{
				env: {
					browser: true,
					es6: true,
					node: true
				},
				extends: 'eslint:recommended',
				parserOptions: {
					sourceType: 'module',
					ecmaVersion: 2017
				},
				rules: {
					indent: [
						'error',
						'tab'
					],
					'no-console': [0],
					'linebreak-style': [
						'error',
						'unix'
					],
					quotes: [
						'error',
						'single'
					],
					semi: [
						'error',
						'always'
					]
				}
			},
		},
		htmllint: {
			settings: {
				'indent-style': 'tabs',
				'attr-quote-style': 'double',
				'spec-char-escape': false,
				'id-class-style': 'dash'
			},
			extensions: [
				'html'
			]
		},
		stylelint: {
			settings: {
				'extends': 'stylelint-config-standard',
				'rules': {
					'indentation': 'tab',
					'number-leading-zero': null
				}
			}
		}
	}
};
