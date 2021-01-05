"use strict";

function setupKeys() {
	window.addEventListener("keydown", function(event) {
		//  
    });

    window.addEventListener("keyup", function(event) {
        if (getKeyCode(event) === ' ') {
        	streamPhoto();
        } else if (getKeyCode(event) === 't') {
            socket.emit("test_run");
        }
    });
}

function getKeyCode(event) {
    let k = event.charCode || event.keyCode;
    let c = String.fromCharCode(k).toLowerCase();
    return c;
}