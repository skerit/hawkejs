module.exports = function(Hawkejs, Blast) {

	var async = require('async'),
	    path  = require('path'),
	    fs    = require('fs');

	/**
	 * Get template source file by requesting it from the server
	 * 
	 * @author   Jelle De Loecker   <jelle@kipdola.be>
	 * @since    1.0.0
	 * @version  1.0.0
	 *
	 * @param    {String}     templateName
	 * @param    {Function}   callback
	 */
	Hawkejs.prototype.getSourceInternal = function getSourceInternal(templateName, callback) {

		var xhr = new XMLHttpRequest();

		// Set the AJAX handler
		xhr.onreadystatechange = function onResponse() {

			if (!(this.readyState == 4 && this.status == 200)) {
				return;
			}

			callback(null, this.response);
		};

		xhr.open('POST', '/hawkejs/template');
		xhr.setRequestHeader('Content-type', 'application/json');
		xhr.responseType = 'text';

		xhr.send(JSON.stringify({name: templateName}))
	};

	/**
	 * Render the wanted template
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    1.0.0
	 * @version  1.0.0
	 *
	 * @param    {String}    templateName
	 * @param    {Object}    variables
	 * @param    {Function}  callback
	 *
	 * @return   {ViewRender}
	 */
	Hawkejs.prototype.render = function render(payload, callback) {

		var that = this,
		    viewRender;

		// Create a new ViewRender object
		viewRender = new Hawkejs.ViewRender(this);

		// Indicate it's a client render
		viewRender.clientRender = true;

		// Add the root element
		viewRender.root = document;

		// Assign the payload
		Blast.Bound.Object.assign(viewRender, payload);

		// Start executing the template code
		viewRender.beginRender(payload.mainTemplate, payload.variables);

		// If a callback has been given, make sure it gets the html
		if (callback) {
			viewRender.finish(function(err) {

				var tasks = [];

				if (err) {
					return callback(err);
				}

				// Iterate over every block to make sure it's completed
				Blast.Bound.Object.each(viewRender.blocks, function blockIter(block, name) {
					tasks.push(block.joinBuffer.bind(block));
				});

				Blast.Bound.Function.parallel(tasks, callback);
			});
		}

		return viewRender;
	};

	/**
	 * Detect if the given templateName is already in the root or its children
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    1.0.0
	 * @version  1.0.0
	 */
	Hawkejs.ViewRender.prototype.detectTemplate = function detectTemplate(templateName, root) {

		var elements,
		    i;

		if (!root) {
			root = this.root;
		}

		elements = root.getElementsByTagName('x-hawkejs');

		for (i = 0; i < elements.length; i++) {
			if (elements[i].getAttribute('data-origin') === templateName) {
				return true;
			}
		}

		return false;
	};

	/**
	 * Get the block element
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    1.0.0
	 * @version  1.0.0
	 */
	Hawkejs.ViewRender.prototype.getBlockElement = function getBlockElement(blockName, root) {

		var elements,
		    i;

		if (!root) {
			root = this.root;
		}

		elements = root.getElementsByTagName('x-hawkejs');

		for (i = 0; i < elements.length; i++) {
			if (elements[i].getAttribute('data-name') === blockName) {
				return elements[i];
			}
		}

		return false;
	};

	/**
	 * Do the extensions that haven't been executed so far,
	 * on the client side.
	 *
	 * When the last doExtensions is done this does NOT mean all the blocks are
	 * done, either. (This is because we don't execute extensions already on the
	 * page)
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    1.0.0
	 * @version  1.0.0
	 */
	Hawkejs.ViewRender.prototype.doExtensions = function doExtensions(variables, callback) {

		var that  = this,
		    tasks = [];

		// Check what extension index was done last
		if (typeof this.lastExtensionIndex !== 'number') {
			this.lastExtensionIndex = -1;
		}

		that.extensions.forEach(function(extension, index) {

			// Skip extensions that have already been done
			if (index <= that.lastExtensionIndex) {
				return;
			}

			if (that.detectTemplate(extension)) {
				return;
			}

			// Remember this extension has already been done
			that.lastExtensionIndex = index;

			tasks[tasks.length] = function executeExtension(next) {
				that.execute(extension, variables, false, function doneExtensionExecute() {
					next();
				});
			};
		});

		Blast.Bound.Function.parallel(tasks, function doneAllExtensions(err) {

			that.running--;

			if (callback) {
				callback();
			}

			that.checkFinish();
		});
	};
};