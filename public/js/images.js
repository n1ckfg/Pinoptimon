"use strict";

function encodeBase64Image(img, format) {
    let c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    let ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return c.toDataURL('image/' + format);
}

function saveBase64Image(img, fileName) {
    let extensionTemp = fileName.split('.');
    let format = extensionTemp[extensionTemp.length - 1];

    let imgBase64 = encodeBase64Image(img, format);

    let a = document.createElement("a"); //Create <a>
    a.href = imgBase64; //Image Base64 Goes here
    a.download = fileName; //File name Here
    a.click(); //Downloaded file
}

function encodeBase64ImageStereo(img, stereoMode, format) {
    let c = document.createElement('canvas');
    
    if (stereoMode === "ou") {
        c.width = img.naturalWidth;
        c.height = img.naturalHeight / 2.0;
    } else {
        c.width = img.naturalWidth / 2.0;
        c.height = img.naturalHeight;
    } 
    
    let ctx = c.getContext('2d');
    
    let imgL, imgR;

    if (stereoMode === "ou") {
        ctx.drawImage(img, 0, 0);
        imgL = c.toDataURL('image/' + format);
        ctx.drawImage(img, 0, -img.naturalHeight / 2.0);
        imgR = c.toDataURL('image/' + format);
    } else {
        ctx.drawImage(img, 0, 0);
        imgL = c.toDataURL('image/' + format);
        ctx.drawImage(img, -img.naturalWidth / 2.0, 0);
        imgR = c.toDataURL('image/' + format);
    }
    
    return [imgL, imgR];
}

function saveBase64ImageStereo(img, stereoMode, fileName) {
    let fileNameSplit = fileName.split('.');
    let extension = fileNameSplit[fileNameSplit.length - 1];
    let shortFileName = "";
    for (let i=0; i<fileNameSplit.length-1; i++) {
        shortFileName += fileNameSplit[i];
    }

    let imgBase64 = encodeBase64ImageStereo(img, stereoMode, extension);

    let a = document.createElement("a"); //Create <a>
    a.href = imgBase64[0]; //Image Base64 Goes here
    a.download = shortFileName + "_L." + extension; //File name Here
    a.click(); //Downloaded file

    a.href = imgBase64[1]; //Image Base64 Goes here
    a.download = shortFileName + "_R." + extension; //File name Here
    a.click(); //Downloaded file
}

// ~ ~ ~ ~ 

function loadFile(filepath, callback) { 
    // https://codepen.io/KryptoniteDove/post/load-json-file-locally-using-pure-javascript  
    let xobj = new XMLHttpRequest();
    xobj.overrideMimeType("text/plain");
    xobj.open('GET', filepath, true);
    xobj.onreadystatechange = function() {
        if (xobj.readyState == 4 && xobj.status == "200") {
            callback(xobj.responseText);
        }
    };
    xobj.send(null);  
}

function download(filename, url, isBase64, base64format) {
    if (isBase64 === undefined) isBase64 = false;
    if (base64format === undefined) base64format = "image/jpeg";
    let element = document.createElement('a');
    if (isBase64) {
        element.setAttribute("href", "data:" + base64format + ";base64," + decodeURIComponent(url));
    } else {
        element.setAttribute("href", url);
    }
    element.setAttribute("download", filename);
    element.setAttribute("target", "_blank");
    element.style.display = "none";
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}
