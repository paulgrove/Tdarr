


function updateConsole(scannerID, text) {

    var message = [
        scannerID,
        "consoleMessage",
        text,
    ];
    process.send(message);
}

process.on('uncaughtException', function (err) {

    console.error(err.stack);

    updateConsole(scannerID, ":" + err.stack)

    if (arrayOrPathSwitch == 1) {

        var message = [
            scannerID,
            "finishScan",
            DB_id,

        ];
        process.send(message);

    }

    //  process.exit();
});




var scannerID = process.argv[2]
var DB_id = process.argv[3]
var arrayOrPath = process.argv[4]
var arrayOrPathSwitch = process.argv[5]
var allowedContainers = process.argv[6]
allowedContainers = allowedContainers.split(',');
var mode = process.argv[7]




var filePropertiesToAdd = JSON.parse(process.argv[8])


var homePath = process.argv[9]
var closedCaptionScan = process.argv[10]

updateConsole(scannerID, "Online.")



var path = require("path");
var fs = require('fs');

if (fs.existsSync(path.join(process.cwd() + "/npm"))) {

    var rootModules = path.join(process.cwd() + '/npm/node_modules/')

} else {
    var rootModules = ''
}


const isDocker = require(rootModules + 'is-docker');
const exiftool = require(rootModules + "exiftool-vendored").exiftool
var shell = require(rootModules + 'shelljs');


var home = require("os").homedir();
//var homePath = home



if (mode == 0) {

    if (isDocker()) {
        console.log("Filescanner in Docker")

        var filesInDB = fs.readFileSync("/temp/" + scannerID + ".txt", 'utf8')
        fs.unlinkSync("/temp/" + scannerID + ".txt")
    } else {

        var filesInDB = fs.readFileSync(homePath + "/Tdarr/Data/" + scannerID + ".txt", 'utf8')
        fs.unlinkSync(homePath + "/Tdarr/Data/" + scannerID + ".txt")
    }





    filesInDB = filesInDB.split('\r\n')

} else if (mode == 3) {

    if (isDocker()) {
        arrayOrPath = fs.readFileSync("/temp/" + scannerID + ".txt", 'utf8')
        fs.unlinkSync("/temp/" + scannerID + ".txt")

    } else {
        arrayOrPath = fs.readFileSync(homePath + "/Tdarr/Data/" + scannerID + ".txt", 'utf8')
        fs.unlinkSync(homePath + "/Tdarr/Data/" + scannerID + ".txt")
    }


    arrayOrPath = arrayOrPath.split('\r\n')


    var filesInDB = []


} else {

    var filesInDB = []

}




updateConsole(scannerID, `vars received:

${process.argv}

`
)

//console.log("arrayOrPath" + arrayOrPath)
//console.log(arrayOrPathSwitch)


if (arrayOrPathSwitch == 0) {

    // process array

    // arrayOrPath = arrayOrPath.split(',');

    for (var i = 0; i < arrayOrPath.length; i++) {



        if (checkContainer(arrayOrPath[i]) != true) {

            updateConsole(scannerID, `File ${arrayOrPath[i]} does not meet container requirements.`)



            arrayOrPath.splice(i, 1)
            i--;

        }



    }


    updateConsole(scannerID, `Launching FFprobe on these files: ${arrayOrPath}`)

    arrayOrPath = arrayOrPath.filter(row => !row.includes("TdarrNew"))

    ffprobeLaunch(arrayOrPath)



}

if (arrayOrPathSwitch == 1) {

    //scanFiles'(DB_id,arrayOrPath,arrayOrPathSwitch) {

    // scanFilePath

    var foundCounter = 0

    var filesToScan = []




    traverseDir(arrayOrPath)


    function traverseDir(inputPathStem) {


        fs.readdirSync(inputPathStem).forEach(file => {

            var fullPath = (path.join(inputPathStem, file)).replace(/\\/g, "/");

            try {
                if (fs.lstatSync(fullPath).isDirectory()) {

                    try {
                        traverseDir(fullPath);
                    } catch (err) {
                        console.error(err.stack);
                        updateConsole(scannerID, ":" + err.stack)
                    }
                } else {



                    fullPath = fullPath.replace(/\\/g, "/");


                    updateConsole(scannerID, `Found: ${fullPath}`)


                    if (filesInDB.includes(fullPath)) {

                        var idx = filesInDB.indexOf(fullPath)

                        filesInDB.splice(idx, 1)






                    } else {

                        if (checkContainer(fullPath) == true) {


                            foundCounter++

                            if (foundCounter % 100 == 0) {

                                var message = [
                                    scannerID,
                                    "updateScanFound",
                                    DB_id,
                                    "Found:" + foundCounter,

                                ];
                                process.send(message);


                            }



                            filesToScan.push(fullPath)



                        } else {

                        }
                    }
                }  //end current file, go to next
            } catch (err) {
                console.error(err.stack);
                updateConsole(scannerID, ":" + err.stack)
            }
        });



    };


    foundCounter = 0

    filesToScan = filesToScan.filter(row => !row.includes("TdarrNew"))

    ffprobeLaunch(filesToScan)


}




// var message = [
//     workerNumber,
//     "percentage",
//     output
// ];
// process.send(message);







function checkContainer(newFile) {

    try {
        var path = require('path');
        var fileType = ((path.extname(newFile)).split(".")).join("")

        for (var j = 0; j < allowedContainers.length; j++) {

            //console.log(fileType.toLowerCase())
            //    console.log(allowedContainers[j].toLowerCase())

            if (fileType.toLowerCase() == allowedContainers[j].toLowerCase()) {
                return true
            }
        }

    } catch (err) {

        console.error(err.stack);
        updateConsole(scannerID, ":" + err.stack)

    }
    return false
}






process.on('exit', (code) => {

    //   console.log(`About to exit with code: ${code}`);


    if (arrayOrPathSwitch == 1) {

        var message = [
            scannerID,
            "finishScan",
            DB_id,

        ];
        process.send(message);

    }
});




function ffprobeLaunch(filesToScan) {


    updateConsole(scannerID, `ffprobeLaunch received these files:${filesToScan} `)


    var ffprobe = require(rootModules + 'ffprobe'),
        ffprobeStatic = require(rootModules + 'ffprobe-static');
    var path = require("path");
    var ffprobeStaticPath = ''


    ffprobeStaticPath = require(rootModules + 'ffprobe-static').path


    var k = 0;


    function loopArray(filesToScan, i) {






        var filepath = filesToScan[i]




        try {
            if (fs.existsSync(filepath)) {

                // Meteor.call('logthis', "Extracting data from this file:" + filepath, function (error, result) { });


                updateConsole(scannerID, `Launching FFprobe on this file: ${filepath}`)

                ffprobe(filepath, { path: ffprobeStaticPath }, function (err, jsonData) {
                    //if (err) return done(err);



                    if (err) {

                        updateConsole(scannerID, `FFprobe extract error on this file:${filepath}`)

                        extractDataError(filepath, err)

                        i++;
                        if (i < filesToScan.length) {
                            loopArray(filesToScan, i);
                        } else {
                            exiftool.end()
                        }


                    }

                    if (jsonData) {

                        updateConsole(scannerID, `FFprobe extract success on this file:${filepath}. Launching exiftool`)

                        exiftool
                            .read(filepath)
                            .then((tags /*: Tags */) => {
                                // console.log(
                                //     `Title: ${tags.Title}`
                                //)
                                updateConsole(scannerID, `exiftool finished on this file:${filepath}`)

                              //  extractData(filepath, jsonData, tags)


                                //

                               


                                if(closedCaptionScan == 'true'){

                                  

                                    var CCExtractorPath
                                    var workerCommand
                            
                                    if (process.platform == 'win32') {
                            
                                        if (fs.existsSync(path.join(process.cwd() + "/npm"))) {
                                            CCExtractorPath = path.join(process.cwd() + '/assets/app/ccextractor/ccextractorwin.exe')
                                        } else {
                                            CCExtractorPath = path.join(process.cwd() + '/private/ccextractor/ccextractorwin.exe')
                                        }
                            
                                        workerCommand = CCExtractorPath + "  -stdout -endat 01:00 --screenfuls 1 \"" + filepath + "\""
                            
                                    }
                            
                                    if (process.platform == 'linux') {
                                        if (fs.existsSync(path.join(process.cwd() + "/npm"))) {
                                            CCExtractorPath = path.join(process.cwd() + '/assets/app/ccextractor/ccextractor')
                                        } else {
                                            CCExtractorPath = path.join(process.cwd() + '/private/ccextractor/ccextractor')
                                        }

                                        var filepathUnix = filepath.replace(/'/g, '\'\"\'\"\'');
                            
                                        workerCommand = CCExtractorPath + "  -stdout -endat 01:00 --screenfuls 1 '" + filepathUnix + "'"
                            
                            
                                        
                                    }
                            
                                    if (process.platform == 'darwin') {
                                        workerCommand = ""
                            
                                    }
                            
                            
                            
                                    console.log(workerCommand)
                            
                                    var CCExtractorOutput = ""
                            
                                    console.log("Checking for captions")
                            
                                    updateConsole(scannerID, `Checking for captions`)
                            
                                    var shellWorker = shell.exec(workerCommand, function (code, stdout, stderr, stdin) {
                            
                                        CCExtractorOutput += stdout
                                        CCExtractorOutput += stderr
                            
                                        console.log('Exit code:', code);
                            
                                        var hasClosedCaptions

                                        if(CCExtractorOutput.includes('Permission denied') || CCExtractorOutput.includes('not found') || CCExtractorOutput.includes('error while loading')){

                                            console.log(CCExtractorOutput)
                                            hasClosedCaptions = false
                            
                                        }else if (CCExtractorOutput.includes('XDS:')) {
    
                                            console.log("Captions found: true")
                                            hasClosedCaptions = true
                                            
                            
                                        } else {

                                            console.log("Captions found: false")
                                            hasClosedCaptions = false
                 
                                        }
                            
    
                                        extractData(filepath, jsonData, tags, hasClosedCaptions)
    
                                        i++;
                                        if (i < filesToScan.length) {
                                            loopArray(filesToScan, i);
                                        } else {
                                            exiftool.end()
                                        }
                            
                                    });
    
    



                                }else{


                                    extractData(filepath, jsonData, tags)
    
                                    i++;
                                    if (i < filesToScan.length) {
                                        loopArray(filesToScan, i);
                                    } else {
                                        exiftool.end()
                                    }



                                }



                                //


                          


                            }
                            )

                    }

                });
            }
        } catch (err) {

            console.error(err.stack);
            updateConsole(scannerID, ":" + err.stack)

            i++;
            if (i < filesToScan.length) {
                loopArray(filesToScan, i);
            } else {
                exiftool.end()
            }


        }





    }





    if (!Array.isArray(filesToScan) || !filesToScan.length) {

        exiftool.end()

    } else {

        loopArray(filesToScan, k);

    }


    function extractDataError(filepath, err) {


        var thisFileObject = {}

        var path = require('path');
        var container = ((path.extname(filepath)).split(".")).join("")
        thisFileObject.container = container.toLowerCase();

        thisFileObject.ffProbeRead = "error"

        try {
            var singleFileSize = fs.statSync(filepath)
            var singleFileSize = singleFileSize.size

            var fileSizeInMbytes = singleFileSize / 1000000.0;
            thisFileObject.file_size = fileSizeInMbytes




        } catch (err) { }

        thisFileObject.cliLog = "FFprobe was unable to extract data from this file. It is highly likely that the file is corrupt."

        updateConsole(scannerID, `FFprobe was unable to extract data from this file:${filepath}`)

        var obj = {
            HealthCheck: "Error",
            TranscodeDecisionMaker: "Transcode error",
            lastHealthCheckDate: new Date(),
            lastTranscodeDate: new Date(),
        }

        addFileToDB(filepath, thisFileObject, obj)

    }



    function extractData(filepath, jsonData, tags, hasClosedCaptions) {

        var thisFileObject = {}

        if(closedCaptionScan == 'true'){

        thisFileObject.hasClosedCaptions = hasClosedCaptions

        }


        thisFileObject.meta = tags


        updateConsole(scannerID, `Beginning extractData on:${filepath}`)



        var path = require('path');
        var container = ((path.extname(filepath)).split(".")).join("")
        thisFileObject.container = container.toLowerCase();

        thisFileObject.ffProbeRead = "success"
        thisFileObject.ffProbeData = jsonData

        updateConsole(scannerID, `Tagging ffprobe data:${filepath}`)

        var jsonString = JSON.stringify(jsonData)



        updateConsole(scannerID, `Tagging size data:${filepath}`)

        try {
            var singleFileSize = fs.statSync(filepath)
            var singleFileSize = singleFileSize.size

            var fileSizeInMbytes = singleFileSize / 1000000.0;
            thisFileObject.file_size = fileSizeInMbytes




        } catch (err) { }

        try {
            var bit_rate = (8 * singleFileSize) / parseFloat(thisFileObject.ffProbeData.streams[0]["duration"])
            thisFileObject.bit_rate = bit_rate

        } catch (err) {



            updateConsole(scannerID, `Tagging bitrate data failed:${filepath}`)

        }


        //if (!!("video_codec_name" in thisFileObject)) {

        if (jsonString.includes('"codec_type":"video"')) {

            updateConsole(scannerID, `Tagging video res:${filepath}`)

            try {



                var vidWidth = thisFileObject.ffProbeData.streams[0]["width"]
                var vidHeight = thisFileObject.ffProbeData.streams[0]["height"]
                var videoResolution = ""

                //    console.log(vidWidth, vidHeight)

                //Bounds +- 10%
                // 480p	720	480		648	792		432	528
                // 576p	720	576		648	792		518.4	633.6
                // 720p	1280	720		1152/864	1408		648	792
                // 1080p	1920	1080		1728	2112		972	1188
                // 4KUHD	3840	2160		3456	4224		1944	2376
                // DCI4K	4096	2160		3686.4	4505.6		1944	2376
                // 8KUHD	7680	4320		6912	8448		3888	4752




                if (vidWidth >= 642 && vidWidth <= 792 && vidHeight >= 100 && vidHeight <= 528) {
                    videoResolution = "480p"
                } else if (vidWidth >= 648 && vidWidth <= 792 && vidHeight >= 100 && vidHeight <= 634) {
                    videoResolution = "576p"
                } else if (vidWidth >= 100 && vidWidth <= 1408 && vidHeight >= 100 && vidHeight <= 792) {
                    videoResolution = "720p"
                } else if (vidWidth >= 100 && vidWidth <= 2112 && vidHeight >= 100 && vidHeight <= 1188) {
                    videoResolution = "1080p"
                } else if (vidWidth >= 100 && vidWidth <= 4224 && vidHeight >= 100 && vidHeight <= 2376) {
                    videoResolution = "4KUHD"
                } else if (vidWidth >= 100 && vidWidth <= 4506 && vidHeight >= 100 && vidHeight <= 2376) {
                    videoResolution = "DCI4K"
                } else if (vidWidth >= 100 && vidWidth <= 8448 && vidHeight >= 100 && vidHeight <= 5752) {
                    videoResolution = "8KUHD"
                } else {
                    videoResolution = "Other"
                }


                thisFileObject.video_resolution = videoResolution

            } catch (err) {

                updateConsole(scannerID, `Tagging video res failed:${filepath}`)
            }

            thisFileObject.fileMedium = "video"
            thisFileObject.video_codec_name = thisFileObject.ffProbeData.streams[0]["codec_name"]




        } else if (jsonString.includes('"codec_type":"audio"')) {

            thisFileObject.fileMedium = "audio"
            thisFileObject.audio_codec_name = thisFileObject.ffProbeData.streams[0]["codec_name"]
        } else {

            thisFileObject.fileMedium = "other"
        }


        //   thisFileObject.cliLog = "No info"

        filePropertiesToAdd.cliLog += "\n"

        // console.log(JSON.stringify(thisFileObject))



        //


        addFileToDB(filepath, thisFileObject, filePropertiesToAdd)


        //




    }
}


function addFileToDB(filePath, FileObject, obj) {

    updateConsole(scannerID, `Sending add file to DB:${filePath}`)


    //

    var obj = JSON.parse(JSON.stringify(obj));

    FileObject._id = filePath
    FileObject.file = filePath
    FileObject.DB = DB_id

    FileObject.processingStatus = false
    FileObject.createdAt = new Date()

    if (FileObject.file_size == undefined) {
        FileObject.file_size = 0;
    }

    if (FileObject.bit_rate == undefined) {
        FileObject.bit_rate = 0;
    }

    FileObject.statSync = fs.statSync(filePath)

    obj.history += addHistory(FileObject)

    function addHistory(row) {

        var histoyString = "-------------------------------------\n"

        histoyString += `Date:${row.createdAt.toISOString()}\n`
        histoyString += `Size:${row.file_size != undefined ? parseFloat((row.file_size / 1000).toPrecision(4)) : 0}GB\n`

        histoyString += "Streams:\n"

        if (row.ffProbeData && row.ffProbeData.streams) {
            var streams = row.ffProbeData.streams
            streams = streams.map((row) => {

                var arr = []


                return `<tr><td><p>${row.codec_name}</p></td>`
                    + `<td><p>${row.codec_type}</p></td>` + ""
                    + `<td><p>${row.bit_rate != undefined ? parseFloat((row.bit_rate / 1000000).toPrecision(4)) + " Mbs" : "-"}</p></td>` + ""
                    + `<td><p>${row.tags != undefined && row.tags.language != undefined ? row.tags.language : "-"}</p></td>` + ""
                    + `<td><p>${row.tags != undefined && row.tags.title != undefined ? row.tags.title : "-"}</p></td></tr>`


            })
            streams = streams.join("")

            streams = `<table className="streamsTable"><tbody>${streams}</tbody></table>`

            histoyString += streams




            return histoyString

        } else {
            return "None"
        }


    }



    FileObject = { ...FileObject, ...obj };


    //
    var message = [
        scannerID,
        "addFileToDB",
        JSON.stringify(FileObject),
    ];
    process.send(message);

    foundCounter++

    if (foundCounter % 10 == 0) {

        var message = [
            scannerID,
            "updateScanFound",
            DB_id,
            "Processing:" + foundCounter + "/" + filesToScan.length,

        ];
        process.send(message);

    }


}


