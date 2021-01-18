"use strict";

const camNameBegin = "ws://";
const camNameEnd = ".local:7112";
let camNameList = [];
let camUrls = [];
let camWs = [];
let stillBoxes = [];
let activeCameras = 0;

// ~ ~ ~ ~ ~ ~ ~ ~ 

function takePhoto() {
	resetList();
	console.log("Taking photos...");
	for (let i=0; i<camWs.length; i++) {
		camWs[i].send("take_photo");
	}
}

function streamPhoto() {
	resetList();
	console.log("Streaming photos...");
	for (let i=0; i<camWs.length; i++) {
		camWs[i].send("stream_photo");
	}
}

function makeCamUrls(response) {
	let json = JSON.parse(response);
	camNameList = json["cameras"];
	for (let i=0; i<camNameList.length; i++) {
		let camUrl = camNameBegin + camNameList[i] + camNameEnd;
		camUrls.push(camUrl);
	}
	console.log("camera urls: " + camUrls);
}

function openCamConnections() {
	for (let i=0; i<camUrls.length; i++) {
		console.log("Attempting to open " + camUrls[i]);

		let ws = new WebSocket(camUrls[i]);
		camWs.push(ws);
	}	

	for (let i=0; i<camWs.length; i++) {
		camWs[i].onopen = function(evt) { onOpen(evt) };
		camWs[i].onclose = function(evt) { onClose(evt) };
		camWs[i].onmessage = function(evt) { onMessage(evt) };
	}
}

function slowMode() {
    for (let i=0; i<camWs.length; i++) {
        camWs[i].send("update_slow");
    }  
    console.log("Live feed in slow mode.");
}

function fastMode() {
    for (let i=0; i<camWs.length; i++) {
        camWs[i].send("update_fast");
    }  
    console.log("Live feed in fast mode.");
}

// ~ ~ ~ ~ ~ ~ ~ ~ 

function onOpen(evt) {
	activeCameras++;
	console.log("Active Cameras: " + activeCameras);
	if (activeCameras > camUrls.length) console.log("Error: counted too many active cameras.")
}

function onClose(evt) {
	//activeCameras--;
	//console.log("Active Cameras: " + activeCameras);
	//if (activeCameras < 0) console.log("Error: counted too few active cameras.")
}

function cleanJSON(data) {
	return data.replace(/\\n/g, "\\n")  
   			   .replace(/\\'/g, "\\'")
   			   .replace(/\\"/g, '\\"')
   			   .replace(/\\&/g, "\\&")
   			   .replace(/\\r/g, "\\r")
   			   .replace(/\\t/g, "\\t")
   			   .replace(/\\b/g, "\\b")
   			   .replace(/\\f/g, "\\f")
			   .replace(/[\u0000-\u0019]+/g, ""); 
}

function onMessage(evt) {
	// https://stackoverflow.com/questions/14432165/uncaught-syntaxerror-unexpected-token-with-json-parse
	// This formatting is needed to remove incompatible characters inserted by ofxCrypto in the oF client!
	// Preserve newlines, etc - use valid JSON - remove non-printable and other non-valid JSON chars
	let text = cleanJSON(evt.data);
	let results = JSON.parse(text);
	console.log(results);

	let photo = results["photo"];
	let timestamp = results["timestamp"];
	let hostname = results["hostname"];

	if (photo !== undefined) {
		mainList.fileList.push(photo);
		mainList.timestampList.push(timestamp);
		mainList.hostnameList.push(hostname);

		if (mainList.fileList.length >= activeCameras) {
			mainList.timestampList.sort();
			console.log(mainList.timestampList);
			console.log(mainList.hostnameList);
			let timestampDiff = (mainList.timestampList[mainList.timestampList.length-1] - mainList.timestampList[0]) / 1000.0;
			console.log("*** timestamp diff: " + timestampDiff + " ms");

			sendFileList(mainList);
			resetList();
		}
	}
}

function loadJSON(filepath, callback) { 
    // https://codepen.io/KryptoniteDove/post/load-json-file-locally-using-pure-javascript  
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', filepath, true);
    xobj.onreadystatechange = function() {
        if (xobj.readyState == 4 && xobj.status == "200") {
            callback(xobj.responseText);
        }
    };
    xobj.send(null);  
}

function createCamDivs() {
	let container = document.getElementById("container");
	let newHtml = "";
	let cellWidth = 320;
	let cellHeight = 240;
	let cols = 3;
	let wMax = 0;
	let hMax = 0;

	for (let i=0; i<camNameList.length; i++) {
		let camName = camNameList[i];

		let w = cellWidth * (i % cols);
		if (w > wMax) wMax = w;
		let h = cellHeight * parseInt(i / cols);
		if (h > hMax) hMax = h;

		newHtml += "<div class=\"videobox\" style=\"left: " + w + "px; top: " + h + "px;\">\n";
        newHtml += "<a href=\"http://" + camName + ".local:7113\"><img id=\"" + camName + "_img\" src=\"http://" + camName + ".local:7111/ipvideo\" border=0></a>\n";
        newHtml += "<div class=\"label\">" + camName + "</div>\n";   
        newHtml += "</div>\n";
	}

	container.innerHTML = newHtml;
	container.style = "width: " + (wMax + cellWidth) + "px; height: " + (hMax + cellHeight) + "px;";
}


