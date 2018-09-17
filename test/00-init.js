var assert   = require('assert'),
    Hawkejs  = require('../index.js'),
    hawkejs;

describe('Hawkejs', function() {

	describe('new Hawkejs()', function() {
		it('should construct a new Hawkejs instance', function() {
			hawkejs = new Hawkejs();
		});
	});

	describe('#addViewDirectory(path, weight)', function() {
		it('should register a path as a place to get view files from', function() {
			hawkejs.addViewDirectory(__dirname + '/templates');
		});
	});

	describe('#getSource(templateName, callback)', function() {
		it('should fetch the source of a template', function(done) {

			// Start getting the source
			hawkejs.getSource('simple/string', function(err, source) {

				assert.equal(null, err, 'Could not open file');
				assert.equal('This EJS example can\'t be more simple.', source);

				assert.equal(source, hawkejs.templateSourceCache['simple/string']);

				done();
			});

			// There should be a hinder entry
			assert.equal(true, !!hawkejs.templateSourceHinder['simple/string'], 'First download did not create a hinder object');

			hawkejs.getSource('simple/string', function(err, source) {
				assert.equal(null, err, 'Problem getting template from cache');
			});
		});
	});

	describe('#compile(name, source)', function() {

		it('should compile the given source', function() {

			var src = hawkejs.templateSourceCache['simple/string'],
			    name = 'mycopy',
			    fnc;

			fnc = hawkejs.compile(name, src);

			assert.equal(fnc.name, 'compiledView');
			assert.equal(fnc.sourceName, name);
		});

		it('should compile source without a name as "inline"', function() {

			var fnc;

			fnc = hawkejs.compile('this is inline <%= "code" %>');

			assert.strictEqual(fnc.name, 'compiledView');
			assert.strictEqual(fnc.sourceName, undefined);
			assert.strictEqual(String(fnc).indexOf("timeStart(\"inline\")") > -1, true);
		});

		it('should add line information to multiline javascript', function() {

			var fnc;

			fnc = hawkejs.compile('test this js: <% i = 10;\nprint(i);%>');

			assert.equal(true, (fnc+'').indexOf('lineNr:0') > -1);
		});

		it('should return an errorView function for templates containg syntax errors', function() {

			var fnc,
			    backup = console.log;

			// #compile outputs using console.log, shut it up for now
			console.log = function(){};

			fnc = hawkejs.compile('Parse error: <% ! %>');

			// And put it back
			console.log = backup;

			assert.equal('errorView', fnc.name);
		});
	});

	// Do some basic #render tests, but this will be tested in ViewRender more
	describe('#render(templateName, callback)', function() {
		it('should render text-only templates', function(done) {

			hawkejs.render('simple/string', function doneSimple(err, result) {

				assert.equal(null, err);
				assert.equal('This EJS example can\'t be more simple.', result);

				done();
			});
		});

		it('should print out the wanted variable', function(done) {

			hawkejs.render('simple/variable', {mytext: 'stuff'}, function doneVariable(err, result) {

				assert.equal(null, err);
				assert.equal('It should print out stuff', result);

				done();
			});
		});

		it('should print out nothing if the wanted variable is not defined', function(done) {

			hawkejs.render('simple/variable', {}, function doneVariable(err, result) {

				assert.equal(null, err);
				assert.equal('It should print out ', result);

				done();
			});
		});
	});
});