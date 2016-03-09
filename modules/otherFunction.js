module.exports = {	
	// возвращение строки из объекта
	objToString : function(obj) {
		var arr = obj.words,
			string = '';

		for (var i = 0; i < arr.length; i++) {
			string += arr[i];
		}

		return string;
	},

	// преобразование даты в строку в обратном порядке
	stringDateReverse : function() {
		var date = '' + +new Date(),
			result = '';

		for (var i = date.length -1; i > 3 ; i--) {
			result += date[i];
		}
		return result;
	},
}