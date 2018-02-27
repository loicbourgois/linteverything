const assert = require('assert');
const linteverything = require('../index');
describe('Linteverything', function() {
	describe('normal use', function() {
		it('should lint everything', async function() {
			await linteverything({
				failOnError: false,
				verbose: true
			}).then(data => {
				assert.equal(data.options.verbose, true);
				assert.equal(data.options.linters.eslint, true);
				assert.deepEqual(data.results, []);
			});
		});
	});
});
