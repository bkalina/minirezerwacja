MiniRezerwacja
=======

Mini aplikacja do rezerwacji pokoi stworzona z użyciem JavaScripr, JSON oraz WebSocket.

Do uruchomienia aplikacji potrzebny jest Node.js oraz zainstalowane biblioteki: node-static, ws.

Node.js:				http://nodejs.org/
Instalacja bibliotek:	npm install node-static ws
Uruchomienie serwera:	node hotel.js

Aplikacja umożliwia dokonywanie rezerwacji pokoi w wybranym dni. Wszystkie informację dotyczące rezerwacji przechowywane są w pliku JSON. Dzięki zastosowaniu WebSocket'a informację o wolnych pokojach przesyłane są na bieżąco do każdego połączonego klienta