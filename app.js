

//agoraRtm variables
let agoraClient;
let agoraChannel;
const APP_ID  = appID;
const TOKEN = '';
let uid = String(Math.floor(Math.random()*10000));

//Dynamic route form room number
let queryString = window.location.search;
let urlParams = new URLSearchParams(queryString);
let roomId = urlParams.get('room'); 

//Media stream variables
let localStream;
let remoteStream;
let mediaConstraints = {
   // video: true,
   video:{
      width:{min:640, ideal: 1920, max:1920},
      height:{min:480, ideal: 1080, max:1080},
   },
   audio: true
}

//WebRtc vars
let peerConnection;
let configuration = {
   iceServers: [
      {
         urls:['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
      }
   ]
}

if(!roomId){
   window.location = 'lobby.html';
}

init();

/******************************************Functions*******************************************/
async function init(){
   agoraClient = AgoraRTM.createInstance(APP_ID);
   await agoraClient.login({uid, TOKEN});

   
   agoraChannel = agoraClient.createChannel(roomId);
   await agoraChannel.join();

   //Channel Listening events
   agoraChannel.on('MemberJoined', memberJoinedHandler);
   agoraChannel.on('MemberLeft', memberLeftHandler);

   //Client Listening events
   agoraClient.on('MessageFromPeer', messageFromPeerHandler);


   localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);

   document.querySelector('#stream1').srcObject = localStream;
}

async function createPeerConnection(memberId){
   peerConnection = new RTCPeerConnection(configuration);

   //Establish stream objects and events
   remoteStream = new MediaStream;
   document.querySelector('#stream2').srcObject = remoteStream;
   document.querySelector('#stream2').style.display = 'block';

   //Change local video frame to smaller size
   document.querySelector('#stream1').classList.add('smallFrame');


   if(!localStream){
      localStream = await navigator.mediaDevices.getUserMedia({ //getUserMedia return an object
          video:true,
          audio:true
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
   
   peerConnection.setRemoteDescription(offer)
   .then(()=> console.log("Remote host has set offer"))
   .catch(err => console.log(err));

   // console.log("Offer received: ", offer);
   
   let answer = await peerConnection.createAnswer();
   await peerConnection.setLocalDescription(answer);

   console.log("Answer Set:", answer);

   agoraClient.sendMessageToPeer({text: JSON.stringify({"type": 'answer', "answer": answer})}, memberId);
}

async function setAnswer(answer, memberId){
   console.log("Answer Received: ", answer);
   if(!peerConnection.currentRemoteDescription){
      peerConnection.setRemoteDescription(answer)
      .then(()=> console.log("Local host has set remote description"))
      .catch(err=> console.log(err));
   }
}

/******************************************Event Listeners*******************************************/
window.addEventListener('beforeunload', leaveChannelHandler); //event triggers before a window closes
document.querySelector('#camera-btn').addEventListener('click', toggleCameraHandler);
document.querySelector('#mic-btn').addEventListener('click',toggleMicHandler);

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
      console.log("Message received with answer");
      await setAnswer(message.answer, memberId);
   }
   
   if( message.type == 'candidate'){
      if(peerConnection){
         peerConnection.addIceCandidate(message.candidate);
      }
   }
}

function memberLeftHandler(memberId){
   document.querySelector('#stream2').style.display = 'none';
   document.querySelector('#stream1').classList.remove('smallFrame');
}

async function leaveChannelHandler(){ //Funtion signs user out from signal server
   
   await agoraChannel.leave();
   await agoraClient.logout();
}

async function toggleCameraHandler(){
   let videoTrack = localStream.getTracks().find(track =>track.kind == 'video');
   if(videoTrack.enabled){
      videoTrack.enabled =false;
      document.querySelector('#camera-btn').style.backgroundColor = 'red';
   }else{
      videoTrack.enabled =true;
      document.querySelector('#camera-btn').style.backgroundColor = 'cornflowerblue';
   }
}

async function toggleMicHandler(){
   let audioTrack = localStream.getTracks().find(track =>track.kind == 'audio');
   if(audioTrack.enabled){
      audioTrack.enabled =false;
      document.querySelector('#mic-btn').style.backgroundColor = 'red';
   }else{
      audioTrack.enabled =true;
      document.querySelector('#mic-btn').style.backgroundColor = 'cornflowerblue';
   }
}