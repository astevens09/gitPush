let localStream;
let remoteStream;


//This function ask for permission to the computer camera and microphone
let init = async ()=>{
    localStream = await navigator.mediaDevices.getUserMedia({ //getUserMedia return an object
        video:true,
        audio:false
    });

    //Use the stream
    document.querySelector('#stream1').srcObject = localStream;
}

// function init

//Call init function
init();