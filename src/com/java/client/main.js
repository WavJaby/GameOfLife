//login
const playerNameInput = document.getElementById('playerName');
const playerTeamID = document.getElementById('teamID');
// const playerPassInput = document.getElementById('playerPassWord');
playerNameInput.onkeydown = (event) => {
    if (event.key === 'Enter')
        loginServer();
}

// playerPassInput.onkeydown = (event) => {
//     if (event.key === 'Enter')
//         loginServer();
// }

document.getElementById('loginServer').onclick = () => {
    loginServer();
}

//login
function loginServer() {
    // if (playerNameInput.value.replaceAll(' ', "").length === 0) {
    //     alert('不能為空白');
    // }

    if (serverConnected) {
        socket.send(opcode.login +
            'playerName' + splitKeyStr + playerNameInput.value + splitDataStr +
            'teamID' + splitKeyStr + playerTeamID.value + splitDataStr
            // 'password:' + playerPassInput.innerText + ';'
        );
    }
}

let game;
function loginSuccess(data) {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('serverConnect').style.display = 'none';
    document.getElementById('gameWindow').style.display = 'block';
    console.log(data);
    const chunkInfo = data['chunkInfo'];
    teamID = data['teamID'];


    const deadPixel = 'rgb(10, 10, 10)';
    const alivePixelA = 'rgb(0, 200, 200)';
    const alivePixelB = 'rgb(200, 200, 200)';
    game = new Game(chunkInfo['width'], chunkInfo['height'], deadPixel, alivePixelA, alivePixelB);
}

function receiveData(data) {
    const dataInfo = data['data'];
    switch (data['type']) {
        case 'viewChange':
            //視野外要取得的chunk
            const loadChunkList = dataInfo['loadList'];
            const nullChunkList = dataInfo['nullChunk'];
            loadChunkFromServer(loadChunkList, nullChunkList, data['worldTime']);

            //視野內要更新的chunk
            let viewAreaChunkList = dataInfo['viewArea'];
            updateChunkFromServer(viewAreaChunkList);

            break;
        case 'chunkUpdate':
            game.teamACount = parseInt(dataInfo['teamACount']);
            game.teamBCount = parseInt(dataInfo['teamBCount']);
            game.calculateTeam();
            updateChunkFromServer(dataInfo['viewArea']);
            updateMiniMap();
            break;
    }

    updateWorldTime(data['worldTime']);
}

//解析從伺服器取得的chunk資料
function loadChunkFromServer(loadList, nullChunk, worldTime) {
    // let timer = window.performance.now();
    for (const i in loadList) {
        let teamA = getTeam(loadList[i][0]);
        let teamB = getTeam(loadList[i][1]);

        const chunk = getChunk(i, true);
        chunk.updateCells(teamA, canvas, teamAID);
        chunk.updateCells(teamB, canvas, teamBID);
        chunk.chunkTime = worldTime;
    }

    // console.log(nullChunk)
    for (const i of nullChunk) {
        unloadChunk(i);
    }
    // console.log(window.performance.now() - timer);
}

function updateChunkFromServer(viewAreaChange) {
    for (const i in viewAreaChange) {
        const viewAreaList = viewAreaChange[i];
        for (let j = 0; j < viewAreaList.length; j++) {
            let x = viewAreaList[j][0] % cWidth;
            let y = viewAreaList[j][0] / cWidth | 0;
            viewAreaList[j][2] = viewAreaList[j][1];
            viewAreaList[j][0] = x;
            viewAreaList[j][1] = y;
        }

        let chunk = getChunk(i);
        chunk.updateCells(viewAreaList, canvas);
    }
}

function getTeam(data) {
    let team = [];
    for (const j of data) {
        team.push([
            j % cWidth,
            j / cWidth | 0
        ]);
    }
    return team;
}

function getChunk(locName, clear) {
    let chunk = chunks[locName];
    //沒load的話
    if (chunk === undefined || chunk === null) {
        let chunkLoc = locName.split(',');
        return loadChunk(parseInt(chunkLoc[0]), parseInt(chunkLoc[1]));
    } else if (clear) {
        chunk.clear(canvas);
    }
    return chunk;
}

const maxRequestStringLength = 600;

//跟伺服器取得
function requestChunk(loadList, updateArea) {
    let loc = -1;
    let lastLoc = 0;
    let count = 0;
    while ((loc = loadList.indexOf(';', loc + maxRequestStringLength)) !== -1) {
        setTimeout(() => {
            const data = 'type' + splitKeyStr + 'viewChange' + splitDataStr +
                'worldTime' + splitKeyStr + worldTime + splitDataStr +
                'loadList' + splitKeyStr + loadList.substring(lastLoc, loc) + splitDataStr +
                'viewArea' + splitKeyStr + updateArea.toString() + splitDataStr;
            sendData(data);
        }, (count + 1) * 10);
        count++;
        lastLoc = loc + 1;
    }
    setTimeout(() => {
        let data = 'type' + splitKeyStr + 'viewChange' + splitDataStr +
            'worldTime' + splitKeyStr + worldTime + splitDataStr +
            'loadList' + splitKeyStr + loadList.substring(lastLoc, loadList.length) + splitDataStr +
            'viewArea' + splitKeyStr + updateArea.toString() + splitDataStr;
        sendData(data);
    }, (count + 1) * 10);
}

//放置
function placeCells(placeList) {
    let outList = '';
    for (const i in placeList) {
        outList += ";" + i + ";" + placeList[i];
    }

    let data = 'type' + splitKeyStr + 'place' + splitDataStr +
        'placeList' + splitKeyStr + outList.substring(1) + splitDataStr;
    sendData(data);
}

function sendData(data) {
    if (!serverConnected)
        return;
    socket.send(opcode.data + data);
}

const splitDataStr = '\r\n\r\n';
const splitKeyStr = '\r\n';

// setTimeout(() => document.getElementById('loginServer').click(), 100)
