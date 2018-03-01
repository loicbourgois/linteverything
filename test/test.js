const assert = require('assert');
const linteverything = require('../src/main');
describe('Linteverything', function() {
	describe('normal use', function() {
		it('should lint everything', async function() {
			await linteverything({
				failOnError: false,
				verbose: true
			}).then(data => {
				assert.deepEqual(data.results.length, 28);
			});
		});
	});
});
