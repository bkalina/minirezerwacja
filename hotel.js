var http = require('http');
var url = require('url');
var fs = require('fs');
var Static = require('node-static');
var WebSocketServer = new require('ws');

var rooms=[101, 102, 103, 104, 105, 201, 202, 203, 204, 205, 301, 302, 303, 304 ,305];

var reservations;

var clients = {};

// WebSocket-serwer na porcie 8081
var webSocketServer = new WebSocketServer.Server({port: 8081});
webSocketServer.on('connection', function(ws) {

  var id = Math.random();
  clients[id] = ws;
  console.log("Nowe połączenie " + id);

  ws.on('message', function(message) {
    console.log('Otrzymano komunikat ' + message);

    for(var key in clients) {
      clients[key].send(message);
    }
  });

  ws.on('close', function() {
    console.log('Połączenie zamknięte ' + id);
    delete clients[id];
  });

});

// Wczytanie aktualnych rezerwacji
fs.readFile("lib/reservations.json","utf-8",
	function(error, data){
		if(error){
			console.log("can't read file");
			process.exit();
		}
		else{
			reservations = JSON.parse(data);
		}
	}
);

function notFound(response){
	response.writeHead(404, {'Content-Type': 'text/html'});
	response.end('<h1>File not found!</h1>');
}

// Serwowanie pliku
function getReadFile (response,contentType) {
	return function(error, data){
		if(error) notFound(response);
		else{
			response.writeHead(200, {'Content-Type': contentType});
			response.end(data);
		}
	}
};

// Serwowanie statyczne plików statycznych
function getReadFileStatic (file,response,contentType) {
	var f = fs.statSync(file);
	return function(error, data){
		if(error) notFound(response);
		else{
			response.writeHead(200, {'Content-Length': f.size, 'Content-Type': contentType});
			response.end(data);
		}
	}
};

// Rezerwacja pokoju
function bookRoom(room, year, mon, day){
	var key=year+'-'+mon+'-'+day;
	if(reservations[key] && reservations[key][room]){
		// TEN WARUNEK JEST JUŻ ZBĘDNY PO ZASTOSOWANIU SOCKETA
		// Pokój zajęty - odpowiedz 'Z'
		return 'Z';
	}
	else{
		// Pokój jest wolny - rezerwujemy - odpowiedz 'OK'
		if(reservations[key]){
			reservations[key][room]=true;
			console.log('Room '+room+' reserved');
		}
		else{
			reservations[key]={};
			reservations[key][room]=true;
			console.log('Room '+room+' reserved');
		}
		return 'OK';
	}
}

// Zwolnienie pokoju
function releaseRoom(room, year, mon, day){
	var key=year+'-'+mon+'-'+day;
	// Pokój zarezerwowany - zwalniamy go - odpowiedz 'OK'
	if(reservations[key] && reservations[key][room]){
		reservations[key][room]=false;
		console.log('Room '+room+' free');
		return 'OK';
	}
	// TEN WARUNEK JEST JUŻ ZBĘDNY PO ZASTOSOWANIU SOCKETA
	// Pokój już jest zwolniony, a ktoś w drugim oknie ma jako zarezerwowany - odpowiedz 'W'
	else if(!(reservations[key] && reservations[key][room])){
		return 'W';
	}
}

// Generowanie listy pokoi
function getRooms(year,mon,day){
	var key=year+'-'+mon+'-'+day;
	var table = ['<ul>'];
	for(var i=0; i<rooms.length;i++){
		if(reservations[key] && reservations[key][rooms[i]]){
			// Jest zarezerwowany
			table.push('<li class="booked">');
			table.push(rooms[i]);
			table.push(' <span onclick="release('+rooms[i]+','+year+','+mon+','+day+',this)">Zwolnij</span></li>');
		}
		else{
			// Jest wolny
			table.push('<li class="free">');
			table.push(rooms[i]);
			table.push(' <span onclick="book('+rooms[i]+','+year+','+mon+','+day+',this)">Zarezerwuj</span></li>');
		}
	}
	table.push('</ul>');
	return table.join('\n');
}

// Generowanie tabeli kalendarza
function getCalendar(year,mon,day){
  
	// Numer dnia tygodnia, od 0(pn) do 6(nd)
	function getDay(date) { 
		var day = date.getDay();
		if (day == 0) day = 7;
		return day - 1;
	}
  
	var d = new Date(year, mon);
	var table = ['<table><tr><th>pn</th><th>wt</th><th>śr</th><th>czw</th><th>pt</th><th>sb</th><th>nie</th></tr><tr>'];

	// Miesiąc jako string

	
	// Początek kalendarza
	for (var i=0; i<getDay(d); i++) {
		table.push('<td></td>');
	}

	// Kómórki z datami
	while(d.getMonth() == mon) {
		var dd=d.getDate();
		// Oznaczenie bierzącego dnia klasą today lub todayNoRooms w zaleznosci czy sa pokoje wolne
		if(dd==day){
			if(checkRooms(year, mon, dd)) {
				table.push('<td class="todayNoRooms" onclick="loadRooms('+year+','+mon+','+dd+')">'+dd+'</td>');
			}
			else{
				table.push('<td class="today" onclick="loadRooms('+year+','+mon+','+dd+')">'+dd+'</td>');
			}
		}
		else{
			// Oznaczenie soboty i niedzieli klasą weekend lub noRooms w zaleznosci czy sa pokoje wolne
			if(getDay(d) % 7 == 5 || getDay(d) % 7 == 6){
				if(checkRooms(year, mon, dd)) {
					table.push('<td class="noRooms" onclick="loadRooms('+year+','+mon+','+dd+')">'+dd+'</td>');
				}
				else {
					table.push('<td class="weekend" onclick="loadRooms('+year+','+mon+','+dd+')">'+dd+'</td>');
				}
			}
			// Oznaczenie zwyklych dni bez wolnych pokoi
			else if(checkRooms(year, mon, dd)) {
				table.push('<td class="noRooms" onclick="loadRooms('+year+','+mon+','+dd+')">'+dd+'</td>');
			}
			else{
				table.push('<td onclick="loadRooms('+year+','+mon+','+dd+')">'+dd+'</td>');
			}
		}
		if(getDay(d) % 7 == 6) { // Niedziela, koniec wiersza
			table.push('</tr><tr>');
		}
		d.setDate(d.getDate()+1);
	}

	// Puste komórki na końcu
	if (getDay(d) != 0) {
		for (var i=getDay(d); i<7; i++) {
			table.push('<td></td>');
		}
	}

	// Koniec tabeli
	table.push('</tr></table>');
	return table.join('\n')
}

// Sprawdzanie czy w danym dniu są wolne pokoje
function checkRooms(year,mon,day){
	var key=year+'-'+mon+'-'+day;
	var count = 0;
	for(var i=0; i<rooms.length;i++){
		if(reservations[key] && reservations[key][rooms[i]]){
			// Jest zarezerwowany
			count++;
		}
	}
	if(count==rooms.length){
		// Brak wolnych pokoi
		return true;
	}
	else {
		// Jest co najmniej 1 pokój wolny
		return false;
	}
}

// Funkcja serwerowa
var hotel=function (request, response) {
	var get = url.parse(request.url, true).query;
	// Przekierowanie zapytania o plik hotel.js do funkcji notFound
	if(request.url=='/hotel.js'){
		notFound(response);
	}
	// Przekierowanie zapytania o '/' lub 'hotel.html' do pliku hotel.html
	else if(request.url=='/' || request.url=='/hotel.html'){
		fs.readFile('hotel.html', 'utf-8', getReadFileStatic("./hotel.html",response,'text/html'));
	}
	// Serwowanie stylu css
	else if(request.url.substr(-4)=='.css'){
		fs.readFile('style.css', 'utf-8', getReadFileStatic("./style.css",response,'text/css'));
	}
	// Serwowanie plików JS
	else if(request.url.substr(-3)=='.js'){
		fs.readFile('.'+request.url, 'utf-8', getReadFileStatic(('.'+request.url),response,'application/javascript'));
	}
	// Zapytania do kalendarza
	else if(get['data']=='calendar'){
		response.writeHead(200, {'Content-Type': 'text/plain'});
		response.end(getCalendar(get['year'],get['month'],get['day']));
	}
	// Zapytania do pokoi
	else if(get['data']=='rooms'){
		response.writeHead(200, {'Content-Type': 'text/plain'});
		response.end(getRooms(get['year'],get['month'],get['day']));
	}
	// Zapytanie rezerwacji
	else if(get['data']=='book'){
		response.writeHead(200, {'Content-Type': 'text/plain'});
		response.end(bookRoom(get['room'],get['year'],get['month'],get['day']));
	}
	// Zapytanie zwolnienia
	else if(get['data']=='release'){
		response.writeHead(200, {'Content-Type': 'text/plain'});
		response.end(releaseRoom(get['room'],get['year'],get['month'],get['day']));
	}
	// Wszystkie inne zapytania > notFound
	else{
		notFound(response);
	}
}

// Utworzenie serwera
var server=http.createServer(hotel)
server.listen(8080);
console.log("==========================================================");
console.log("||	Mini system rezerwacji pokoi		.		||");
console.log("||	Serwer uruchomiony http://127.0.0.1:8080/	||");
console.log("==========================================================");

// Przy wyłączeniu serwera dane zostaną zapisane synchronicznie do pliku JSON
process.on('SIGINT',function(){
	console.log('\nZamykanie serwera');
	var jsonString = JSON.stringify(reservations, null, 3);
	fs.writeFileSync("lib/reservations.json", jsonString, 'utf-8');
	process.exit();
});
  
