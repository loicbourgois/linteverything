module.exports = {
	failOnError: true,
	linters: {
		checkstyle: true,
		eslint: true,
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
		}
	}
};
