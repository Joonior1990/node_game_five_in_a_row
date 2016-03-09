module.exports = function(data) {
	var arrX = data[0];
	var arrY = data[1];
	console.log(arrX);
	console.log(arrY);
	var result = searchResultGorizont(arrX, arrY, 'add');

	if (!result)
		var result = searchResultGorizont(arrY, arrX, 'add');

	if (!result)
		var result = searchResultDiagonal(arrX, arrY, 'upp');

	if (!result)
		var result = searchResultDiagonal(arrX, arrY, 'dif');

	if (!result)
		var result = searchResultDiagonal(arrY, arrX, 'dif');

	console.log(result);
	return result;

	function searchResultGorizont(arrX, arrY, attr) {
		var result;
		var result = [];

		for (var i = 0; i < arrX.length; i++) {
			result.length = 0;
			var X = +arrX[i];
			var Y = +arrY[i];
			result.push({x: X, y: Y});
			var check = false;

			for (var j = 1; j < 5; j++) {
				var nextX = X;
				var nextY = Y + j;
				
				if (nextY == 51 || nextY == 0) break;

				for (var k = 0; k < arrY.length; k++) {
					if (arrY[k] == nextY && X == arrX[k]) {
						result.push({x: arrX[k], y: nextY});
						var check = true;
					}
				}
			}
			if (result.length == 5) {
				break;
			}
		}
		// console.log(result);
		if (result.length == 5) {
			return true;
			console.log('user win');
		} else {
			return false;
			console.log('user loose');		
		}
	}
	function searchResultDiagonal(arrX, arrY, attr) {
		var result;
		var result = [];

		for (var i = 0; i < arrX.length; i++) {
			result.length = 0;
			var X = +arrX[i];
			var Y = +arrY[i];
			result.push({x: X, y: Y});
			var check = false;

			for (var j = 1; j < 5; j++) {
				var nextX = (attr == 'upp') ? (X + j) : (X - j);
				var nextY = (attr == 'upp') ? (Y + j) : (Y + j);
				
				if (nextY == 51 || nextY == 0) break;

				for (var k = 0; k < arrY.length; k++) {
					if (arrY[k] == nextY && arrX[k] == nextX) {
						result.push({x: nextX, y: nextY});
						var check = true;
					}
				}
			}
			if (result.length == 5) {
				break;
			}
		}
		// console.log(result);
		if (result.length == 5) {
			return true;
			console.log('user win');
		} else {
			return false;
			console.log('user loose');		
		}
	}

	function find(array, value) {
		if (array.indexOf) { // если метод существует
		  return array.indexOf(value);
		}

		for (var i = 0; i < array.length; i++) {
		  if (array[i] === value) return i;
		}

		return -1;
	}
}




