const assert = require('assert');
const linteverything = require('../index');
describe('Linteverything', function() {
	describe('normal use', function() {
		it('should lint everything', async function() {
			await linteverything({
				verbose: true
			}).then(data => {
				assert.equal(data.options.verbose, true);
				assert.deepEqual(data.results, []);
			});
		});
	});
});
