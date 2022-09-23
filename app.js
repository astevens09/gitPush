

//agoraRtm variables
let agoraClient;
let agoraChannel;
const APP_ID  = appID;
const TOKEN = '';
let uid = String(Math.floor(Math.random()*10000));

//Media stream variables
let localStream;
let remoteStream;



init();


/******************************************Functions*******************************************/
async function init(){
   agoraClient = AgoraRTM.createInstance(APP_ID);
   await agoraClient.login({uid, TOKEN});

   //For now the channel will be main but in the future
   //it will have a room number the can be used for a URL query string
   agoraChannel = agoraClient.createChannel('main');
   await agoraChannel.join();

   

}

async function createOffer() {

}

async function createAnswer(){

}

/******************************************Handler Functions*******************************************/
