//login
const playerNameInput = document.getElementById("playerName");
// const playerPassInput = document.getElementById("playerPassWord");
playerNameInput.onkeydown = (event) => {
    if (event.key === 'Enter')
        loginServer();
}

// playerPassInput.onkeydown = (event) => {
//     if (event.key === 'Enter')
//         loginServer();
// }

document.getElementById("loginServer").onclick = () => {
    loginServer();
}

//login
function loginServer() {
    // if (playerNameInput.value.replaceAll(" ", "").length === 0) {
    //     alert("不能為空白");
    // }

    if (serverConnected) {
        socket.send(opcode.login +
            'playerName' + splitKeyStr + playerNameInput.value + splitDataStr
            // 'password:' + playerPassInput.innerText + ';'
        );
    }
}


function loginSuccess(data) {
    document.getElementById("loginPage").style.display = 'none';
    document.getElementById("serverConnect").style.display = 'none';
    document.getElementById("gameWindow").style.display = 'block';
    console.log(data);
    const chunkInfo = data['chunkInfo'];


    const deadPixel = 'rgb(10, 10, 10)';
    const alivePixelA = 'rgb(0, 200, 200)';
    const alivePixelB = 'rgb(200, 200, 200)';
    startGame(chunkInfo['width'], chunkInfo['height'], deadPixel, alivePixelA, alivePixelB);
}


const splitDataStr = "\r\n\r\n";
const splitKeyStr = "\r\n";
let dataLoading = false;

function receiveData(data) {
    switch (data['type']) {
        case 'viewChange':
            const loadList = data['data']['loadList'];

            //先清掉視野外的chunk
            for (const i in chunks) {
                const chunk = chunks[i];
                const loc = i.split(",");
                const cx = parseInt(loc[0]), cy = parseInt(loc[1]);
                if (cx < nowChunkStartX || cx > nowChunkStartX + nowChunkCountX - 1 ||
                    cy < nowChunkStartY || cy > nowChunkStartY + nowChunkCountY - 1) {
                    chunk.clear(canvas);
                }
            }

            for (const i in loadList) {
                const chunkChangeList = loadList[i];
                const allTeam = getTeam(chunkChangeList);

                const chunk = getChunk(i, true);
                chunk.addCells(allTeam.a, canvas, teamAID);
                chunk.addCells(allTeam.b, canvas, teamBID);
            }

            let viewAreaChange = data['data']['viewArea'];
            upDateChunk(viewAreaChange);
            break;
        case 'chunkUpdate':
            let viewAreaUpdate = data['data']['viewArea'];
            upDateChunk(viewAreaUpdate);
            break;
    }

    updateWorldTime(data['worldTime']);
    dataLoading = false;
}

function getChunk(locName, clear) {
    let chunk = chunks[locName];
    //沒load的話
    if (chunk === undefined) {
        let chunkLoc = locName.split(",");
        return loadChunk(parseInt(chunkLoc[0]), parseInt(chunkLoc[1]));
    } else if (clear)
        //清除所有
        chunk.clear(canvas);
    return chunk;
}

function upDateChunk(viewAreaChange) {
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
    let allTeam = {a: [], b: []}
    for (const j of data) {
        let team = j[1];
        let x = j[0] % cWidth;
        let y = j[0] / cWidth | 0;
        if (team === teamAID) {
            allTeam.a.push([x, y]);
        } else if (team === teamBID) {
            allTeam.b.push([x, y]);
        }

    }
    return allTeam;
}


function requestChunk(loadList, updateArea) {
    let data = 'type' + splitKeyStr + 'viewChange' + splitDataStr +
        'worldTime' + splitKeyStr + worldTime + splitDataStr +
        'loadList' + splitKeyStr + loadList + splitDataStr +
        'viewArea' + splitKeyStr + updateArea.toString() + splitDataStr;
    // console.log(data)
    // console.log(updateArea)
    if (!dataLoading)
        setTimeout(sendData(data), 10);
    else
        sendData(data);

}

function sendData(data) {
    if (!serverConnected)
        return;
    dataLoading = true;
    socket.send(opcode.data + data);
}

setTimeout(() => document.getElementById('loginServer').click(), 100)
