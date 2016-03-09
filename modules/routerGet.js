var getAction = require('../modules/getAction');
var constant = require('./constant');

module.exports = function(req, res, url) {
	if (typeof getAction[url] == 'function') {
		if (url == 'game' && req.session.login != constant.user_guest) {
			getAction['/404'](res); // редирект, если нет и 404
			return;
		}

		getAction[url](res, req);
	} else {
		getAction['/404'](res); // редирект, если нет и 404
	}
}