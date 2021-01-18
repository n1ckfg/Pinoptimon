"use strict";

const socket = io();

let mainList = {
	fileList: [],
	timestampList: [],
	hostnameList: []
};

function resetList() {
	mainList.fileList = [];
	mainList.timestampList = [];
	mainList.hostnameList = [];
}

function sendFileList(data) {
    //slowMode();         
    socket.emit("download_files", data);
}

socket.on("download_complete", function(data) {
    //fastMode();
});

/*
socket.on("receive_example", function(data) {
    let index = data[0]["index"];
    let last = layers.length - 1;
  	if (newStrokes.length > 0 && layers.length > 0 && layers[last].frames) layers[last].frames[index] = newStrokes;
});

function sendExample() {
    socket.emit("send_example", tempStrokeToJson());
}
*/
