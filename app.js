let localStream;
let remoteStream;



init();


/******************************************Functions*******************************************/
async function init(){
    //Video stream from user
    localStream = await navigator.mediaDevices.getUserMedia({
        video:true,
        audio:true
    });

    //Pass stream to html element
    document.querySelector('#stream1').srcObject = localStream;

}

async function createOffer() {
let localPeerConnection;
let localIceCandidate;
let remotePeerConnection;
  //Create local peer connection
  localPeerConnection = new RTCPeerConnection();

  //get iceCandidates
  localPeerConnection.onicecandidate = function (e) {
    if (e.candidate) {
      console.log(JSON.stringify(e.candidate));
    }
  };
  //establish data channels
  let dataChannel = localPeerConnection.createDataChannel("main");
  dataChannel.onopen = (e) => console.log("Data channel open");
  dataChannel.onmessage = (e) => console.log("Message: ", e.data);

  //local localDescription set
  let offer = await localPeerConnection.createOffer();
  console.log(offer);
  localPeerConnection
    .setLocalDescription(offer)
    .then(() => console.log("Description set"));
}

//send offer
//recieve answer
//local remoteDescription set

//Stun server
//Handle message based on message type: offer, answer, candidate, etc.
//

//Establish remote peer connection
//remote remoteDescription set
//establish data channel
//remote localeDescription set
//respond with answer

//
