/*global QUnit, $, sinon, window*/

// Unit testing jQuery plugins is a pain in the arse because everything is so static.  If you can see what I'm 
// missing here (eg: how to get a fresh instance of $.Mustache on each run) then please enlighten me!
var defaultOptions = $.extend({}, $.Mustache.options);

module("jQuery-Mustache", { 
	setup: function () {
		
	},
	teardown: function () {
		// Clear all templates.
		$.Mustache.clear();
		
		// Restore the default options.
		$.each(defaultOptions, function (key, val) {
			$.Mustache.options[key] = val;
		});
	}
});

QUnit.test("Mustache plugin exposed on jQuery", function () { 
	QUnit.equal(typeof $.Mustache, "object", "$.Mustache Plugin exposed");
});

QUnit.test("allow overwrites when adding templates by default", function () { 
	$.Mustache.add('name', 'a');
	$.Mustache.add('name', 'b');
	
	QUnit.equal($.Mustache.render('name'), 'b', "Template was overwritten");
});

QUnit.test("Disallowing overwriting templates triggers an error if an overwrite occurs", function () { 
	this.stub($, 'error');
	
	$.Mustache.options.allowOverwrite = false;
	
	$.Mustache.add('name', 'a');
	$.Mustache.add('name', 'b');
	
	QUnit.ok($.error.calledOnce);
});

QUnit.test("clear() removes all templates and flushes the Mustache cache.", function () { 
	this.spy(window.Mustache, 'clearCache');
	this.stub($, 'error');
	
	$.Mustache.add('name', 'a');
	$.Mustache.clear();
	
	$.Mustache.options.warnOnMissingTemplates = true;
	$.Mustache.render('name');
	
	QUnit.ok($.error.calledOnce, "Template was removed");
	QUnit.ok(window.Mustache.clearCache.calledOnce, "Mustache cache was cleared");
});

QUnit.test("render() returns empty string if template not mapped and warnOnMissingTemplates is false", function () {
	this.stub($, 'error').throws("$.error should not have been invoked");
	
	$.Mustache.options.warnOnMissingTemplates = false;
	var result = $.Mustache.render('missingTemplate');
	
	QUnit.equal(result, '', "Empty String returned");
});

QUnit.test("render() calls $.error if template not mapped and warnOnMissingTemplates is true", function () {
	this.stub($, 'error');
	
	$.Mustache.options.warnOnMissingTemplates = true;
	$.Mustache.render('missingTemplate');
	
	QUnit.ok($.error.calledOnce, "$.error invoked");
});

QUnit.test("render() invoked Mustache.to_html with all the relevant bits and bobs", function () { 
	var spy = this.spy(window.Mustache, 'to_html');
	var viewModel = { };
	var expectedTemplateMap = {
			templateOne: 'A Template',
			templateTwo: 'Another Template'
	};
	
	// Register all templates.
	for (var key in expectedTemplateMap) {
		$.Mustache.add(key, expectedTemplateMap[key]);
	}
	
	$.Mustache.render('templateOne', viewModel);
	
	QUnit.ok(spy.calledOnce);
	QUnit.ok(spy.calledWith('A Template', viewModel));
	QUnit.deepEqual(spy.firstCall.args[2], expectedTemplateMap, "Template map supplied");
});

QUnit.test("templates() returns all registered templates", function () { 
	var expected = [ 'a', 'b', 'c' ];
	
	// Register all templates.
	$.each(expected, function () { 
		$.Mustache.add(this, this);
	});
	
	// Result order is not guaranteed
	QUnit.deepEqual($.Mustache.templates().sort(), expected);
});

QUnit.test("templates() returns empty Array if no templates are registered", function () { 
	QUnit.deepEqual($.Mustache.templates(), []);
});

QUnit.test("remove() does what it says on the tin", function () { 
	$.Mustache.add('name', 'template');
	$.Mustache.remove('name');
	
	$.Mustache.options.warnOnMissingTemplates = true;
	
	this.stub($, 'error');
	$.Mustache.render('name');

	QUnit.ok($.error.calledOnce);
});

QUnit.test("remove() returns the previous template value", function () { 
	$.Mustache.add('name', 'template');
	
	QUnit.equal($.Mustache.remove('name'), 'template');
});

QUnit.test("remove() returns `undefined` if template was not previously mapped", function () { 
	QUnit.equal($.Mustache.remove('unregistered'), void 0);
});

QUnit.test("Templates are trimmed of leading and trailing whitespace when added", function () { 
	var source = " \t Lots of  leading\twhitespace!!\t";
	var expected = "Lots of  leading\twhitespace!!";
	
	$.Mustache.add('name', source);
	QUnit.equal($.Mustache.render('name'), expected);
});

QUnit.test("externalTemplateDataType respected when external templates are loaded", function () {
	this.stub($, 'ajax');	
	$.ajax.returns($.Deferred());

	$.Mustache.options.externalTemplateDataType = "html";
	$.Mustache.load("template_url");

	QUnit.equal($.ajax.firstCall.args[0].dataType, "html", "externalTemplateDataType passed to jQuery.ajax()");
});