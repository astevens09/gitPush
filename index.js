let APP_ID = appID;
console.log(appID);

let TOKEN= "";
let uid = String(Math.floor(Math.random()*10000));
// console.log(uid);

//AgoraRTM client and channels
let client;
let channel;

//WebRTC streams and connections
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


//This function connects to the stun server and establishes local stream
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
//These message are handled relative to the computer
let handleMessageFromPeer = async (message, MemberId) =>{
    
    message = JSON.parse(message.text);

    if(message.type == 'offer'){
        await createAnswer(MemberId, message.offer);
    }

    if(message.type == 'answer'){
        await addAnswer(message.answer);
    }

    if(message.type == 'candidate'){
        if(peerConnection){
            peerConnection.addIceCandidate(message.candidate);
        }
    }
    
}


//Handle function used for MemberJoined Event
let handleUserJoined = async (MemberId)=>{
    console.log('A new user joined the channel', MemberId);
    createOffer(MemberId);
}

//This function function creates the answer from remote peer
let createPeerConnection = async (MemberId) =>{
    peerConnection = new RTCPeerConnection(servers);

    remoteStream = new MediaStream;
    document.querySelector('#stream2').srcObject = remoteStream;

    if(!localStream){
        localStream = await navigator.mediaDevices.getUserMedia({ //getUserMedia return an object
            video:true,
            audio:false
        });
    
        //Use the stream
        document.querySelector('#stream1').srcObject = localStream;
    }


    //Send localStream video/audio 
    localStream.getTracks().forEach((track)=>{
        peerConnection.addTrack(track, localStream);
    });

    
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
}

//Create offer function or other peer
//This interface stores all the information between the local and remote peer
//and it provides methods to connect to that peer
let createOffer = async (MemberId)=>{
    await createPeerConnection(MemberId);

    //Create and set session description
    let offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    //AgoraRTM client send message to peer
    client.sendMessageToPeer({text: JSON.stringify({"type": 'offer', "offer": offer})}, MemberId);

}

//Create answer function back to initial peer
let createAnswer = async(MemberId, offer) =>{
    await createPeerConnection(MemberId);

    await peerConnection.setRemoteDescription(offer);

    let answer = await peerConnection.createAnswer();
    peerConnection.setLocalDescription(answer);

    //AgoraRTM client send message to peer
    client.sendMessageToPeer({text: JSON.stringify({"type": 'answer', "answer": answer})}, MemberId);
}


//Add answer to remote description
let addAnswer = async (answer) =>{
    if(!peerConnection.currentRemoteDescription){
      await peerConnection.setRemoteDescription(answer);
    }
}
//Call init function
init();