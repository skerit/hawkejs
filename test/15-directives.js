var assert   = require('assert'),
    Hawkejs  = require('../index.js'),
    hawkejs,
    test_id = 0;

describe('Directives', function() {

	before(function() {
		hawkejs = new Hawkejs();
	});

	describe('Empty attributes', function() {
		var tests = [
			['<p hidden whatever></p >', '<p hidden whatever></p>'],
			['<p hidden whatever=""></p >', '<p hidden whatever></p>']
		];

		createTests(tests);
	});

	describe('Expression values', function() {
		var tests = [
			[
				`<span value={% date.getFullYear() %}></span>`,
				'<span value="2019"></span>'
			]
		];

		createTests(tests);
	});

	describe('Expressions in attribute values', function() {

		var tests = [
			[
				`<span value="{% "test" %}"></span>`,
				`<span value="test"></span>`
			],
			[
				`<span value="A {% "B" %} C"></span>`,
				`<span value="A B C"></span>`
			],
			[
				`<span value="1 {% 1+1 %} 3"></span>`,
				`<span value="1 2 3"></span>`
			]
		];

		createTests(tests);
	});

	describe('Code in attribute values', function() {

		var tests = [
			[
				`<span value="<% "test" %>"></span>`,
				`<span value="test"></span>`
			],
			[
				`<span value="A <% "B" %> C"></span>`,
				`<span value="A B C"></span>`
			],
			[
				`<span value="1 <% 1+1 %> 3"></span>`,
				`<span value="1 2 3"></span>`
			],
			[
				`<span value="1 <% print("test") %> 3"></span>`,
				`<span value="1 test 3"></span>`
			]
		];

		createTests(tests);
	});

	describe('Unquoted values', function() {
		var tests = [
			[
				`<span value=3></span>`,
				`<span value="3"></span>`
			],
			[
				`<span value=alpha><i></i></span>`,
				`<span value="alpha"><i></i></span>`
			],
			[
				`<span value=alpha foo=bar class="test" azerty= ok><i></i></span>`,
				`<span class="test" value="alpha" foo="bar" azerty="ok"><i></i></span>`
			]
		];

		createTests(tests);
	});

	describe('Boolean attributes', function() {
		var tests = [
			[
				`<div id="bla" hidden>Content</div>`,
				`<div id="bla" hidden>Content</div>`
			]
		];

		createTests(tests);
	});
});

function createTests(tests) {
	for (let i = 0; i < tests.length; i++) {
		let code = tests[i][0],
		    title = tests[i][0].replace(/\n/g, '\\n').replace(/\t/g, '\\t'),
		    result = tests[i][1];

		if (title.length > 74) {
			title = title.slice(0, 72) + '…';
		}

		it(title, function(next) {
			test_id++;

			var compiled = hawkejs.compile('test_' + test_id, code),
			    vars;

			vars = {
				empty_arr : [],
				full_arr  : [0],
				single    : [0],
				numbers   : [0, 1, 2, 3],
				empty_obj : {},
				date      : new Date('2019-03-07'),
				test      : {
					name  : 'testname',
					one   : 1,
					three : 3,
					two   : {
						three: {
							four: 4
						}
					}
				}
			};

			hawkejs.render(compiled, vars, function done(err, res) {

				if (err) {
					return next(err);
				}

				assert.strictEqual(res, result);
				next();
			});
		});
	}
}