if (!window.WebSocket) {
	document.body.innerHTML = 'Twoja przeglądarka nie wspiera WebSocket.';
}
// nawiązać połączenie
var socket = new WebSocket("ws://"+window.location.hostname+":8081");

var loadEverything = function() {
	var now=new Date();
	var year=now.getFullYear();
	var month=now.getMonth();
	var day=now.getDate();
	loadCalendar(year,month,day);
	loadRooms(year,month,day);
	setDate(year,month,day);
}

// Zwolnienie pokoju
function release(room,year,mon,day,element){
	var req = new XMLHttpRequest();

	req.onreadystatechange = function() {  
		if (req.readyState == 4) {
			if(req.status == 200) {
				// Poprawne zwolnienie pokoju - ustawienie stylu na free
				if(req.responseText=='OK'){
					element.innerHTML='Zarezerwuj';
					element.parentElement.className='free';
					element.onclick=function(){book(room,year,mon,day,element)};
					loadCalendar (year, mon, day);
					// Wysłanie daty w której zaszła zmiana
					var date = new Date(year,mon,day);
					socket.send(date);
					// Gdy damy tutaj loadRooms to po każdej akcji zostanie odswieżona lista pokoi i ich aktualny status
					//loadRooms (year,mon,day);
				}
				// TEN WARUNEK JEST JUŻ ZBĘDNY PO ZASTOSOWANIU SOCKETA
				// Próba zwolnienia pokoju, który już jest wolny
				else if(req.responseText=='W'){
					element.innerHTML='Zarezerwuj';
					element.parentElement.className='free';
					element.onclick=function(){book(room,year,mon,day,element)};
					loadCalendar (year,mon,day);
					// Aktualizacja listy pokoi
					loadRooms (year,mon,day);
					alert('Ktoś już zwolnił ten pokój. \nAktualizacja listy pokoi.');
				}
				else{
					alert('Nie udało się zwolnić pokoju:\n'+req.responseText);
				}
			}
			else{
				alert('Nie można połaczyc się z serwerem\nSpróbuj poźniej')
			}
		}
	}
	req.open('GET', document.location+'?data=release&month='+mon+'&room='+room+'&year='+year+'&day='+day, true); 
	req.send();
}
 
// Rezerwacja pokoju
function book(room,year,mon,day,element){
  var req = new XMLHttpRequest();
  
	req.onreadystatechange = function() {  
		if (req.readyState == 4) {
			if(req.status == 200) { 
				if(req.responseText=='OK'){
					// Poprawna rezerwacja - dodanie parametru onclick
					element.innerHTML='Zwolnij';
					element.parentElement.className='booked';
					element.onclick=function(){release(room,year,mon,day,element)};
					loadCalendar (year, mon, day);
					// Wysłanie daty w której zaszła zmiana
					var date = new Date(year,mon,day);
					socket.send(date);
					// Gdy damy tutaj loadRooms to po każdej akcji zostanie odswieżona lista pokoi i ich aktualny status
					//loadRooms (year,mon,day);
				}
				// TEN WARUNEK JEST JUŻ ZBĘDNY PO ZASTOSOWANIU SOCKETA
				// Serwer odpowiada 'Z' czyli pokój już jest zajęty - to na wypadek gdy 2 osoby chcą rezerwować ten sam pokój
				else if(req.responseText=='Z'){
					element.innerHTML='Zwolnij';
					element.parentElement.className='booked';
					element.onclick=function(){release(room,year,mon,day,element)};
					loadCalendar (year, mon, day);
					// Aktualizacja listy pokoi
					loadRooms (year,mon,day);
					alert('Pokój już zajęty! \nAktualizacja listy pokoi.');
				}
				else{
					alert('Nie udało się zarezerwować pokoju:\n'+req.responseText);
				}
			}
			else{
				alert('Nie można połaczyc się z serwerem\nSpróbuj poźniej')
			}
		}
	}
	req.open('GET', document.location+'?data=book&month='+mon+'&room='+room+'&year='+year+'&day='+day, true); 
	req.send();
}

// Zapytanie o kalendarz
function loadCalendar (year, month, day){
	var req = new XMLHttpRequest();
	var calendarElem = document.getElementById('calendar');

	req.onreadystatechange = function() {  
		if (req.readyState == 4) {
			if(req.status == 200) { 
				var monthString = monthToString(month);
				var navHeader = '<div class="calendarHead"><h3>'+monthString+' '+year+' '+'</h3>';
				var navPrev = '<button style="float: left;" onclick="changeCalendar('+year+','+month+',0)" type=button>'+monthToString(month-1)+'</button>';
				var navNext = '<button style="float: right;" onclick="changeCalendar('+year+','+month+',1)" type=button>'+monthToString(month+1)+'</button></div>';
				calendarElem.innerHTML= navHeader + navPrev + navNext + req.responseText;
			}
			else{
				alert('Nie można połaczyc się z serwerem\nSpróbuj poźniej')
			}
		}
	}
	req.open('GET', document.location+'?data=calendar&month='+month+'&year='+year+'&day='+day, true); 
	req.send();
}

// Zmiana miesiąca
function changeCalendar(year, month, type) {
	var d = new Date(year, month);
	switch(type){
		case 0:
			d.setMonth((month-1),1);
			break;
		case 1:
			d.setMonth((month+1),1);
			break;
	}
	setDate(d.getFullYear(),d.getMonth(),d.getDate());
	loadCalendar(d.getFullYear(),d.getMonth(),d.getDate());
	loadRooms(d.getFullYear(),d.getMonth(),d.getDate());
}

// Zapytanie o listę pokoi
function loadRooms (year,month,day){
	var req = new XMLHttpRequest();
	var roomsElem = document.getElementById('rooms');
	req.onreadystatechange = function() {  
		if (req.readyState == 4) {
			if(req.status == 200) { 
				roomsElem.innerHTML=req.responseText;
				setDate(year,month,day);
				// Przeladowanie kalendarza - aktualizacja stylu bierzącego dnia
				loadCalendar (year, month, day);
			}
			else{
				alert('Nie można połaczyc się z serwerem\nSpróbuj poźniej')
			}
		}
	}
	req.open('GET', document.location+'?data=rooms&month='+month+'&year='+year+'&day='+day, true); 
	req.send();
}

// Ustawienie daty na stronie
function setDate (year,month,day){
	var date=new Date(year,month,day);
	var tim=document.getElementById('dat');
	tim.innerHTML=date.toLocaleDateString();
	tim.datetime=date.toISOString();
}

// Miesiąc jako string
function monthToString(month) {
	switch(month){
		case -1:
			return 'Grudzień';
		case 0:
			return 'Styczeń';
		case 1:
			return 'Luty';
		case 2:
			return 'Marzec';
		case 3:
			return 'Kwiecień';
		case 4:
			return 'Maj';
		case 5:
			return 'Czerwiec';
		case 6:
			return 'Lipiec';
		case 7:
			return 'Sierpień';
		case 8:
			return 'Wrzesień';
		case 9:
			return 'Październik';
		case 10:
			return 'Listopad';
		case 11:
			return 'Grudzień';
		case 12:
			return 'Styczeń';
	}
}

// Komunikat z socket'a
socket.onmessage = function(event) {
	var msg = new Date(event.data);
	var cur = document.getElementById('dat').innerHTML;
	var msgDate = msg.toLocaleDateString();
	var curDate = new Date(cur.split('.').reverse().join('/'));
	
	// Porownanie daty na stronie z data z wiadomosci
	if(cur===msgDate)
		// U klientow ktorzy maja aktualnie wlaczoną taką date jak w MSG zostanie przeładowana lista pokoi
		loadRooms(msg.getFullYear(), msg.getMonth(), msg.getDate());
		
	// Daty sie roznia wiec aktualizujemy tylko kalendarz
	else
		// Przeładowanie kalendarza w razie gdyby została wyczerpana ilosc pokoi w jakims dniu
		loadCalendar(curDate.getFullYear(), curDate.getMonth(), curDate.getDate());
};
