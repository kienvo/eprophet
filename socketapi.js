const io = require( "socket.io" )();
const socketapi = {
    io: io
};


io.on('connection', (socket) => {
	console.log('Socket.io: a user connected');
	io.to(socket.id).emit('data', {
		labels: [
			'0h00', '0h05', '0h10', '0h15', '0h20', '0h25',
			'0h30', '0h35', '0h40', '0h45', '0h50', '0h55'
		],
		datasets: [{
			label: 'Energy',
			data: [12, 15, 3, 5, 2, 3, 12, 15, 3, 5, 2, 3],
			borderWidth: 3
		}]
	});
});

module.exports = socketapi;