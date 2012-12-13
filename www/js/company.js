// 設定ファイルの読み込み
function companyGetSetting(callfn) {
	// ファイルの読み込み
//	console.log("Start setting");
	var fname = 'setting';
	getFile(fname,companyGetSettingOK,companyGetSettingNG);

	function companyGetSettingOK(json){
		console.log("OK : setting");
		getonMSG(json,callfn);
	}

	function companyGetSettingNG(){
		console.log("NG : setting");
		location.href="index.html";
		return false;
	}
}

function companyLoginCheck(json,callfn){

	var callback = $FN(callfn);

	var url = json.https + 'company01/send_actpw_company.php';
	var hash = {
		uid: json.uid,
		act_key: json.act_key,
		app_ver: json.app_ver,
		app_code: json.app_code
	}

	$.ajax({
		type: "POST",
		url: url,
		data:hash,
		success: function(data){
			if (data && data.uid) {
				return callback(json);
			}else{
				delFile('setting');

				message = '設定が変更されました。再度、ログインをお願い致します。';
				title = '再ログイン';
				button = 'OK';
				navigator.notification.alert(message, companyLogin(), title, button);
			}
		},
		error: function() {
			companyNetError();
		}
	});
}

function companyLogin(){
	window.location.href = 'index.html';
}

function companyNetError(url){
	if(url){
		var goUrl = url;
	}else{
		var goUrl = 'netError.html';
	}
	message = '通信が混み合っているか、通信環境がよくないため、もうしばらくお待ちしてから、接続しなおしてください。';
	title = 'サーバーと通信できませんでした';
	button = 'OK';
	navigator.notification.alert(message, companyNetErrorReturn(), title, button);

	function companyNetErrorReturn(){
		window.location.href = goUrl;
	}
}

