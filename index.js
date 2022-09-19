let APP_ID = appID;
console.log(appID);

let TOKEN= "";
let uid = String(Math.floor(Math.random()*10000));
console.log(uid);

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
    await client.login({uid,TOKEN});


    //index.html?room=12345
    channel = client.createChannel('main');
    await channel.join();

    //Channel event listener form `Member Joined` event
    channel.on('MemberJoined', handleUserJoined);

    client.on('MessageFromPeer', handleMessageFromPeer);

    localStream = await navigator.mediaDevices.getUserMedia({ //getUserMedia return an object
        video:true,
        audio:false
    });

    //Use the stream
    document.querySelector('#stream1').srcObject = localStream;

    
}

//Handle function for `MessageFromPeer` event
let handleMessageFromPeer = async (message, MemberId) =>{
    message = JSON.parse(message.text);
    console.log('Message: ', message);
}


//Handle function used for MemberJoined Event
let handleUserJoined = async (MemberId)=>{
    console.log('A new user joined the channel', MemberId);
    createOffer(MemberId);
}

//Create offer function or other peer
//This interface stores all the information between the local and remote peer
//and it provides methods to connect to that peer
let createOffer = async (MemberId)=>{
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
            client.sendMessageToPeer({text: JSON.stringify({"type": 'candidate', "candidate": event.candidate})}, MemberId);
            console.log('New ice candidate: ', event.candidate)
        }
    }

    //Create and set session description
    let sessionDescription = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(sessionDescription);

    //AgoraRTM client send message to peer
    client.sendMessageToPeer({text: JSON.stringify({"type": 'offer', "offer": sessionDescription})}, MemberId);

}

// function init

//Call init function
init();