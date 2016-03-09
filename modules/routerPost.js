var postAction = require('./postAction');

module.exports = function(req, res, data) {
	if (typeof postAction[data.action] == 'function') {
		postAction[data.action](req, res, data);
	}
}