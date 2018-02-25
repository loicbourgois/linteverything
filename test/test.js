const assert = require('assert');
const linteverything = require('../index');
describe('Array', function() {
	describe('#indexOf()', function() {
		it('should lint everything', function() {
			linteverything({
				verbose: true
			}).then(data => {
				assert.equal(data.options.verbose, true);
				assert.deepEqual(data.results, []);
			});
		});
	});
});
