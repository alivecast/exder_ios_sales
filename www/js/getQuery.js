var q = new Array();
function getQuery(){
	if(location.search){
		var query = location.search;
		query = query.substring(1,query.length);
		var querys = new Array();
		querys = query.split("&");
		for(i=0;i<querys.length;i++){
			var pram = new Array();
			pram = querys[i].split("=");
			var name = pram[0];
			var value = pram[1];
			q[name] = value;
		}
	}
}