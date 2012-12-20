// base64 encode ---------------------------------------------------------------
function encBase64(str) {
	b64_str = base64.encode(str, 1);
	return b64_str;
}

// base64 decode ----------------------------------------------------------------
function decBase64(b64_str) {
	str = base64.decode(b64_str, 1);
	return str;
}

// JSON encode ------------------------------------------------------------------
function encJson(obj) {
	json = JSON.stringify(obj);
	return json;
}

// JSON decode ------------------------------------------------------------------
function decJson(json) {
	obj = JSON.parse(json);
	return obj;
	// obj.params = value
}

// ランダム文字列 -------------------------------------------------------------
function randPass(length) {
	length = length || '';
	// var rand = 'abcdefghijklmnopqrstuvwxyz' + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' + '0123456789';
	var rand = 'abcdef' + '0123456789';
	rand = rand.split('');
	var pass = '';
	for (var i = 0; i < length; i++) {
		pass += rand[Math.floor(Math.random() * rand.length)];
	}
	return pass;
}

// htmlでのGET受け取り -------------------------------------------------------------
function getQuery() {
	if (1 < document.location.search.length) {
		// 最初の1文字(?記号)を除いた文字列を取得する
		var query = document.location.search.substring(1);

		// クエリの区切り記号(&)で文字列を配列に分割する
		var parameters = query.split('&');
		var result = new Object();
		for (var i = 0; i < parameters.length; i++) {
			// パラメータ名とパラメータ値に分割する
			var element = parameters[i].split('=');
			var paramKey = decodeURIComponent(element[0]);
			console.log("paramKey " + paramKey);
			var paramValue = decodeURIComponent(element[1]);
			console.log("paramValue " + paramValue);
			// パラメータ名をキーとして連想配列に追加する
			result[paramKey] = paramValue;
		}
		return result;
	}
	return null;
}

//
function getDate(timestamp) {
	var ts = parseInt(timestamp);
	var d = new Date(ts * 1000);
	var year = d.getFullYear();
	var month = d.getMonth() + 1;
	var day = d.getDate();
	return String(year) + '年' + String(month) + '月' + String(day) + '日';
}

function getDateTime(timestamp) {
	var ts = parseInt(timestamp);
	var d = new Date(ts * 1000);
	var year = d.getFullYear();
	var month = d.getMonth() + 1;
	var day = d.getDate();
	var hour = (d.getHours() < 10 ) ? '0' + d.getHours() : d.getHours();
	var min = (d.getMinutes() < 10 ) ? '0' + d.getMinutes() : d.getMinutes();
	var sec = (d.getSeconds() < 10 ) ? '0' + d.getSeconds() : d.getSeconds();
	return String(year) + '年' + String(month) + '月' + String(day) + '日 ' + String(hour) + ':' + String(min) + ':' + String(sec);
}

// 桁区切り
function currency(str) {
	var num = new String(str).replace(/,/g, "");
	while (num != ( num = num.replace(/^(-?\d+)(\d{3})/, "$1,$2")));
	return num;
}

// fnが関数ならそのまま返し、文字列なら関数名にして返す
function $FN(fn) {
	return ( typeof fn == 'function') ? fn : Function('x', 'return ' + fn);
}

// ファイル書込処理(書き込み成功ならokfn関数を実行、失敗ならerrfn関数を実行)
function setFile(fname, jsonObj, okfn, errfn) {
	fname = 'exorderdir' + fname;
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, write, setNG);
	function write(fileSystem) {
		fileSystem.root.getFile(fname, {
			create : true,
			exclusive : false
		}, function(fileEntry) {
			fileEntry.createWriter(function(writer) {
				writer.onwrite = function(evt) {
					console.log("書き込み成功: " + JSON.stringify(jsonObj));
				};
				writer.onerror = function(evt) {
					console.log('書き込みに失敗' + evt.toString());
				};
				// 暗号化
				var encText = encAesObj(jsonObj);
				console.log('setFile::encText: ' + encText);
				writer.write(encText);
				callback = $FN(okfn);
				return callback(encText);
			}, setNG);
		}, setNG);
	}

	function setNG(error) {
		console.log("ファイルを書き込めませんでした。");
		callback = $FN(errfn);
		return callback()
	}

}

// ファイル読み込み処理(読み込み成功ならokfn関数を実行、失敗ならerrfn関数を実行)
function getFile(fname, okfn, errfn) {
	fname = 'exorderdir' + fname;
	var text = {};
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, read, noFile);
	function read(fileSystem) {
		fileSystem.root.getFile(fname, {}, function(fileEntry) {
			fileEntry.file(function(file) {
				var reader = new FileReader();
				reader.onloadend = function(evt) {
					// ここに読み込み完了後の処理を書く
					text = evt.target.result;
					console.log("getFile::正常にファイルを読み込みました。");
					// 複号化
					if (text) {
						console.log("getFile:isText");
						var encText = text;
						var obj = decAesObj(encText);
						callback = $FN(okfn);
						return callback(obj);
					} else {
						console.log("getFile:noText");
						callback = $FN(errfn);
						return callback()
					}
				};
				reader.readAsText(file, "utf-8");
			}, noFile)
		}, noFile);
	}

	function noFile(error) {
		console.log("ファイルを読み込めませんでした。");
		callback = $FN(errfn);
		return callback()
	}

}

// ファイル削除
function delFile(fname) {
	fname = 'exorderdir' + fname;
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem) {
		fileSystem.root.getFile(fname, {
			create : false
		}, function(fileEntry) {
			fileEntry.remove(function() {
				console.log('File removed:' + fname);
			}, fail);
		}, fail);
	}, fail);
}

// ファイル操作　error処理
function fail(error) {
	console.log("ファイル処理失敗: " + error.code);
}

// 設定ファイルの読み込み
function getonOrdering(callfn) {
	// ファイルの読み込み
	console.log("Start ordering");
	var fname = 'ordering';
	getFile(fname, getonOrderingOK, getonOrderingNG);

	function getonOrderingOK(json) {
		console.log("OK : ordering");
		getonMSG(json, callfn);
	}

	function getonOrderingNG() {
		console.log("NG : ordering");
		location.href = "index.html";
		return false;
	}

}

// 超重要メッセージの出力
function getonMSG(json, callfn) {
	// URLの取得
	var callback = $FN(callfn);
	$.ajax({
		type : "POST",
		url : "http://exorder.jp/app/msg.php",
		data : "id1=alivecast&id2=sugoi&app_code=" + json.app_code + "&app_ver=" + json.app_ver,
		success : function(data) {
			if (data) {
				console.log("重要ＭＳＧ");
				button = 'OK';
				title = '【重要メッセージ】';
				navigator.notification.alert(data, callback(json), title, button);
			} else {
				return callback(json);
			}
		},
		error : function() {
			$.ajax({
				type : "POST",
				url : "http://www.alivecast.jp/exorder/msg.php",
				data : "id1=alivecast&id2=sugoi&app_code=" + json.app_code + "&app_ver=" + json.app_ver,
				success : function(data) {
					if (data) {
						console.log("重要ＭＳＧ");
						button = 'OK';
						title = '【重要メッセージ】';
						navigator.notification.alert(data, callback(json), title, button);
					} else {
						return callback(json);
					}
				},
				error : function() {
					return callback(json);
				}
			});
		}
	});
}

// 通信エラーメッセージ文
function networdERR(callfn, title) {
	message = '通信が混み合っているか、通信環境がよくないため、もうしばらくお待ちしてから、接続しなおしてください。';
	button = 'OK';
	callback = $FN(callfn);

	if (title) {
	} else {
		title = '通信エラー';
	}

	navigator.notification.alert(message, callback, title, button);
}

// ネットワーク状態を調べる
function check_network() {
	var domain = 'speed-order.jp';
	navigator.network.isReachable(domain, reachableCallback);
}

// ネットワーク状態を受け取るlコールバック
function reachableCallback(reachability) {
	// 現状では各プラットフォーム間でのreachabilityのフォーマットに関しての一貫性はありません
	var networkState = reachability.code || reachability;

	var states = {};
	states[NetworkStatus.NOT_REACHABLE] = '接続可能なネットワークが見つかりません';
	states[NetworkStatus.REACHABLE_VIA_CARRIER_DATA_NETWORK] = 'データ接続';
	states[NetworkStatus.REACHABLE_VIA_WIFI_NETWORK] = 'WiFi接続';

	alert('接続の形式: ' + states[networkState]);
}

// 郵便番号の取得 //////////////////////////////////////////////////////////////////////
function getAddress() {
	var zipcode = $('#ordering\\[customer_zipcode\\]').val();
	$.get('/app/Ordering/get_address?zip=' + zipcode);
}

function setPref(data) {
	$('#ordering\\[customer_pref\\]').val(data);
	//	var select = $('#ordering\\[customer_pref\\]');
	//	select.val(40);
}

function setAddress(data) {
	$('#ordering\\[customer_address1\\]').val(data);
}

// 合計金額の取得 //////////////////////////////////////////////////////////////////////
function getCarriage(price, carriage, non_carriage_price) {
	var amount = document.getElementById('#order_amount').value;
	var total = (price * amount) + carriage;
	var neoCarriage = carriage;
	if (total >= non_carriage_price) {
		total = (price * amount);
		neoCarriage = 0;
	}
	// 桁区切り
	str = String(total);
	var num = new String(str).replace(/,/g, "");
	while (num != ( num = num.replace(/^(-?\d+)(\d{3})/, "$1,$2")));
	//	return num;
	// 送料無料を反映
	setCarriage(neoCarriage);
	document.getElementById('#total').innerHTML = num + '円(税込)';
}

function setCarriage(carriage) {
	// 桁区切り
	var str = String(carriage);
	var num = new String(str).replace(/,/g, "");
	while (num != ( num = num.replace(/^(-?\d+)(\d{3})/, "$1,$2")));
	if ( num = '0') {
		num = '無料';
	} else {
		num + '円';
	}
	document.getElementById('#carriage').innerHTML = String(num);
}

function timeout() {
	// タイムアウト処理設定
	// $.ajaxSetup({timeout: 3000});

}

// AES128 encode CBC ------------------------------------------------------------
function encAesObj(obj) {
	console.log('::encAesObj::');
	var key = CryptoJS.enc.Hex.parse(randPassWord(32));
	var iv = CryptoJS.enc.Hex.parse(randPassWord(32));
	var str = JSON.stringify(obj);
	var encrypted = CryptoJS.AES.encrypt(str, key, {
		iv : iv
	});
	var enc = {};
	enc['key'] = encrypted.key;
	enc['iv'] = encrypted.iv;
	// enc['enc'] = encrypted;
	enc['enc'] = encrypted.ciphertext.toString(CryptoJS.enc.Base64);
	var encText = encBase64(JSON.stringify(enc));
	return encText;
}

// AES128 decode CBC -------------------------------------------------------------
function decAesObj(encText) {
	console.log('::decAesObj::encText: ' + encText);
	// base64エンコードされてないファイル読み込みの暫定処置
	if (encText.match(/^{/)) {
		var enc = JSON.parse(encText);
	} else {
		var enc = JSON.parse(decBase64(encText));
	}
	var key = enc.key;
	var iv = enc.iv;
	var enc = enc.enc;
	var objText = CryptoJS.AES.decrypt(enc, key, {
		iv : iv
	});
	objText = objText.toString(CryptoJS.enc.Utf8);
	console.log("objText: " + objText);
	var obj = JSON.parse(objText);
	return obj;
}

// ランダム文字列 -------------------------------------------------------------
function randPassWord(length) {
	length = length || '';
	var rand = 'abcdefghijklmnopqrstuvwxyz' + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' + '0123456789';
	// var rand = 'abcdef' + '0123456789';
	rand = rand.split('');
	var pass = '';
	for (var i = 0; i < length; i++) {
		pass += rand[Math.floor(Math.random() * rand.length)];
	}
	return pass;
}

function getLocalStorage(fname) {
	// ファイル名にprifix
	fname += 'exorderdir';
	var value = window.localStorage.getItem(fname);
	return value;
}

function setLocalStorage(fname, value) {
	// ファイル名にprifix
	fname += 'exorderdir';
	window.localStorage.removeItem(fname);
	window.localStorage.setItem(fname, value);
}

function popup(type, title, message) {
	new $pop(message, {
		type : type,
		title : title,
		width: 220,
		height: 140,
		close:false,
		modal: true
	});
}

