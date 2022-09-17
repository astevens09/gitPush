let APP_ID = appID;

let TOKEN = null;
let uid = String(MATH.floor(MATH.random()*10000));

let client;
let channel;

let localStream;
let remoteStream;
let peerConnection;

const servers = {
    iceServer:[
        {
            urls:['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
        }
    ]
}


//This function ask for permission to the computer camera and microphone
let init = async ()=>{
    client = await AgoraRTM.createInstance(APP_ID);
    await client.login({uid, TOKEN});


    //index.html?room=12345
    channel = client.createChannel('main');
    await channel.join();

    localStream = await navigator.mediaDevices.getUserMedia({ //getUserMedia return an object
        video:true,
        audio:false
    });

    //Use the stream
    document.querySelector('#stream1').srcObject = localStream;

    createOffer();
}

//Create offer function or other peer
//This interface stores all the information between the local and remote peer
//and it provides methods to connect to that peer
let createOffer = async ()=>{
    peerConnection = new RTCPeerConnection(servers);

    remoteStream = new MediaStream;
    document.querySelector('#stream2').srcObject = remoteStream;


    //Get localStream audio
    localStream.getTracks().forEach((track)=>{
        peerConnection.addTrack(track, localStream);
    });

    //Get remoteStream audio
    peerConnection.ontrack = (event) =>{
        event.streams[0].getTracks().forEach((track)=>{
            remoteStream.addTrack(track);
        });
    }

    //Create Ice candidates
    peerConnection.onicecandidate = async (event)=>{
        if(event.candidate){
            console.log('New ice candidate: ', event.candidate)
        }
    }

    //Create and set session description
    let sessionDescription = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(sessionDescription);

    console.log(peerConnection);
}

// function init

//Call init function
init();