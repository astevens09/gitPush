

//agoraRtm variables
let agoraClient;
let agoraChannel;
const APP_ID  = appID;
const TOKEN = '';
let uid = String(Math.floor(Math.random()*10000));

//Media stream variables
let localStream;
let remoteStream;

//WebRtc vars
let peerConnection;
let configuration = {
   iceServers: [
      {
         urls:['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
      }
   ]
}



init();


/******************************************Functions*******************************************/
async function init(){
   agoraClient = AgoraRTM.createInstance(APP_ID);
   await agoraClient.login({uid, TOKEN});

   //For now the channel will be main but in the future
   //it will have a room number the can be used for a URL query string
   agoraChannel = agoraClient.createChannel('main');
   await agoraChannel.join();

   //Listening events
   agoraChannel.on('MemberJoined', memberJoinedHandler);
   agoraClient.on('MessageFromPeer', messageFromPeerHandler);


   localStream = await navigator.mediaDevices.getUserMedia({
      audio:true,
      video: true
   });

   document.querySelector('#stream1').srcObject = localStream;
}

async function createPeerConnection(memberId){
   peerConnection = new RTCPeerConnection(configuration);

   //Establish stream objects and events
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

  localStream.getTracks().forEach((track) =>{
      peerConnection.addTrack(track, localStream);
  });

  peerConnection.ontrack = (e)=>{
   // console.log(e.streams);
   e.streams[0].getTracks().forEach(track =>{
      remoteStream.addTrack(track);
   });
}

  //Create and send Ice Candidates
  peerConnection.onicecandidate = async (e)=>{
      if(e.candidate){
         // console.log(e.candidate);
         agoraClient.sendMessageToPeer({text: JSON.stringify({"type": 'candidate',"candidate": e.candidate})}, memberId)
         // console.log('New ice candidate: ', e.candidate);
      }
  }

} 

async function createOffer(memberId){
   await createPeerConnection(memberId);

   let offer = await peerConnection.createOffer();
   await peerConnection.setLocalDescription(offer);

   console.log("Offer created");

   agoraClient.sendMessageToPeer({text: JSON.stringify({"type": 'offer', "offer": offer})},memberId);
}

async function createAnswer(offer,memberId){
   await createPeerConnection(memberId);

   await peerConnection.setRemoteDescription(offer);

   let answer = await peerConnection.createAnswer();
   await peerConnection.setLocalDescription(answer);

   console.log("Answer Set:", answer);

   agoraClient.sendMessageToPeer({text: JSON.stringify({"type": 'answer', "answer": answer})}, memberId);
}

async function setAnswer(answer, memberId){
   if(!peerConnection.currentRemoteDescription){
      await peerConnection.setRemoteDescription(answer);
   }
}

/******************************************Handler Functions*******************************************/
async function memberJoinedHandler(memberId){
   console.log('Hello New Member!!!:',memberId);
   createOffer(memberId);
}

async function messageFromPeerHandler(message, memberId){
   message = JSON.parse(message.text);

   if(message.type == 'offer'){
      await createAnswer(message.offer,memberId);
   }

   if(message.type == 'answer'){
      await setAnswer(message.answer, memberId);
   }
   
   if( message.type == 'candidate'){
      if(peerConnection){
         peerConnection.addIceCandidate(message.candidate);
      }
   }
}