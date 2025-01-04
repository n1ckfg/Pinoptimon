"use strict";

const express = require("express");
const app = express();
const request = require('request');
const fs = require("fs");
const dotenv = require("dotenv").config();
const debug = process.env.DEBUG === "true";
const { exec } = require("child_process");
const path_to_photos = "./photos/images";
//const path_to_opensfm = "./OpenSfM";

//const CALIBRATION_ONLY = true;

let options;
if (!debug) {
	options = {
	    key: fs.readFileSync(process.env.KEY_PATH),
	    cert: fs.readFileSync(process.env.CERT_PATH)
	};
}

const https = require("https").createServer(options, app);

// default -- pingInterval: 1000 * 25, pingTimeout: 1000 * 60
// low latency -- pingInterval: 1000 * 5, pingTimeout: 1000 * 10
let io, http;
const ping_interval = 1000 * 5;
const ping_timeout = 1000 * 10;
const port_http = process.env.PORT_HTTP;
const port_https = process.env.PORT_HTTPS;
const port_ws = process.env.PORT_WS;

const WebSocket = require("ws");
const ws = new WebSocket.Server({ port: port_ws, pingInterval: ping_interval, pingTimeout: ping_timeout }, function() {
    console.log("\nNode.js listening on websocket port " + port_ws);
});

if (!debug) {
    http = require("http");

    http.createServer(function(req, res) {
        res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
        res.end();
    }).listen(port_http);

    io = require("socket.io")(https, { 
        pingInterval: ping_interval,
        pingTimeout: ping_timeout
    });
} else {
    http = require("http").Server(app);

    io = require("socket.io")(http, { 
        pingInterval: ping_interval,
        pingTimeout: ping_timeout
    });
}
   
app.use(express.static("public")); 

app.get("/", function(req, res) {
    res.sendFile(__dirname + "/public/index.html");
});

if (!debug) {
    https.listen(port_https, function() {
        console.log("\nNode.js listening on https port " + port_https);
    });
} else {
    http.listen(port_http, function() {
        console.log("\nNode.js listening on http port " + port_http);
    });
}

//deleteImages();

io.on("connection", function(socket) {
    console.log("A socket.io user connected.");
    
    socket.on("disconnect", function(event) {
        console.log("A socket.io user disconnected."); 
    });

    socket.on("download_files", function(event) {
        //if (CALIBRATION_ONLY) deleteImages();

        exec("rm " + path_to_photos + "/*.jpg", function() {
            let date = Date.now();
            
            for (let i=0; i<event.fileList.length; i++) {
                console.log("Downloading file " + (i+1) + " of " + event.fileList.length + "...");
                saveBase64(event.fileList[i], path_to_photos + "/" + event.hostnameList[i] + "_" + date + ".jpg");
                
                if (i === event.fileList.length-1) {
                    console.log("DOWNLOAD COMPLETE");
                    //socket.emit("download_complete", "hello");

                    //doOpenSfmBatch();
                    doColmap();
                }
            }
        });
    });

    socket.on("test_run", function(event) {
        //doOpenSfmBatch();
        doColmap();
    });
});

ws.on("connection", function(socket) {
    console.log("A user connected.");

    socket.onclose = function(event) {
        console.log("A user disconnected.");
    };

    socket.onmessage = function(event) {
        //
    };
});

/*
function deleteImages() {
	runCmd("rm " + path_to_photos + "/*.jpg");
}
*/

function saveBase64(data, filename) {
    let buffer = new Buffer(data, "base64");
    fs.writeFileSync(filename, buffer);
}

// https://stackoverflow.com/questions/11944932/how-to-download-a-file-with-node-js-without-using-third-party-libraries
function download(url, dest, cb) {
    let file = fs.createWriteStream(dest);
    let sendReq = request.get(url);

    // verify response code
    sendReq.on('response', (response) => {
        if (response.statusCode !== 200) {
            return cb('Response status was ' + response.statusCode);
        }

        sendReq.pipe(file);
    });

    // close() is async, call cb after close completes
    file.on('finish', () => file.close(cb));

    // check for request errors
    sendReq.on('error', (err) => {
        fs.unlink(dest);
        return cb(err.message);
    });

    file.on('error', (err) => { // Handle errors
        fs.unlink(dest); // Delete the file async. (But we don't check the result)
        return cb(err.message);
    });
}

function runCmd(cmd) {
    exec(cmd, function(err, stdout, stderr) {
        if (err) {
            console.error(`exec error: ${err}`);
            return;
        }

        console.log(`result: ${stdout}`);
    });
}

function doColmap() {
    runCmd("colmap automatic_reconstructor --image_path " + path_to_photos + " --workspace_path " + path_to_photos);
    runCmd("colmap model_converter --input_path " + path_to_photos + "/sparse/0 --output_path " + path_to_photos + " --output_type TXT");
}

/*
function doOpenSfm(cmd) {
    runCmd(path_to_opensfm + "/bin/" + cmd + " " + path_to_photos);
}

function doOpenSfmBatch() {
    console.log ("Running OpenSfM...");

    let cmd1 = path_to_opensfm + "/bin/" + "opensfm_run_all" + " " + path_to_photos;
    let cmd2 = path_to_opensfm + "/bin/" + "opensfm undistort" + " " + path_to_photos;
    let cmd3 = path_to_opensfm + "/bin/" + "opensfm compute_depthmaps" + " " + path_to_photos;

    exec(cmd1, function(err, stdout, stderr) {
        if (err) {
            console.error(`exec error: ${err}`);
            return;
        }
        console.log(`result: ${stdout}`);
        exec("cp " + path_to_photos + "/reconstruction.json ./public/");
        if (!CALIBRATION_ONLY) {
            exec(cmd2, function(err, stdout, stderr) {
                if (err) {
                    console.error(`exec error: ${err}`);
                    return;
                }
                console.log(`result: ${stdout}`);

                exec(cmd3, function(err, stdout, stderr) {
                    if (err) {
                        console.error(`exec error: ${err}`);
                        return;
                    }
                    console.log(`result: ${stdout}`);

                    console.log("OpenSfM: completed depth maps. (3/3)");
                });

                console.log("OpenSfM: completed undistortion. (2/3)");
            });

            console.log("OpenSfM: completed calibration. (1/3)");
        } else {
            console.log("OpenSfM: completed calibration.");
        }
    });
}
*/