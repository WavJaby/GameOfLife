let socket;
const opcode = new Opcode();
let serverConnected = false;

function connectSocket() {
    let ip = document.getElementById('serverIp').value;
    let port = document.getElementById('serverPort').value;


    if (!serverConnected)
        socket = new WebSocket('ws://' + ip + ':' + port);

    socket.onopen = () => {
        serverConnected = true;
        console.log('connect server success');
    }

    socket.onclose = () => {
        serverConnected = false;
        console.log('server disconnect');

        // setTimeout(connectSocket, 1000);
    }

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data.substring(1));
        switch (event.data[0]) {
            case opcode.loginSuccess:
                console.log('loginSuccess');
                loginSuccess(data);
                break;
            case opcode.data:
                // console.log('getData');
                receiveData(data);
                break;
            case opcode.loginFailed:
                console.log('loginFailed');
                console.log(data['reason']);
                break;
            case opcode.connectFailed:
                console.log('connectFailed');
                console.log(data['reason']);
                break;
            case opcode.error:
                console.log('error');
                console.log(data['reason']);
                break;
        }
    }
}

//input
const connectServerBtn = document.getElementById('connectServer');
const disconnectServerBtn = document.getElementById('disconnectServer');

connectServerBtn.onclick = () => {
    connectSocket();
}

disconnectServerBtn.onclick = () => {
    if (serverConnected)
        socket.close();
}


connectSocket();
