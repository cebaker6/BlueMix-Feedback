/*-------------------------
 * Demo app for Watson Services
 *-------------------------
 */

var express    = require('express'),
    cors       = require('cors'),
    bodyParser = require('body-parser'),
    watson     = require('watson-developer-cloud'),
    fs         = require('fs'),
    env        = require('node-env-file');

// Use Express
var app = express();
app.use(cors());
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use('/', serveStaticContent());

// server port
var port = process.env.PORT || 3001;

// Web Server
var server = require('http').Server(app);

// Add Socket IO for WebSocket support
var io = require('socket.io')(server);

// In memory array of feedback 
var db = [];


/*-------------------------
 * Define Watson Services
 *-------------------------
 */

// Read the config.env configuration file, 
env(__dirname + '/config.env', {
    overwrite: true,
    raise: false
});

// get credentials from the configuration file for Watson services 
// and create service instances 
var TAcredentials = {
    url: process.env.TA_url,
    version: process.env.TA_version,
    version_date: process.env.TA_version_date,
    username: process.env.TA_username,
    password: process.env.TA_password
};
var toneAnalyzer = watson.tone_analyzer(TAcredentials);

var LTcredentials = {
    url: process.env.LT_url,
    version: process.env.LT_version,
    username: process.env.LT_username,
    password: process.env.LT_password,
    silent: true
};
var language_translation = watson.language_translation(LTcredentials);

/*-------------------------
 * URL endpoints 
 *-------------------------
 */

app.get('/', function(req, res, next) {
    next();
});

app.post('/submitFeedback', function(req, res) {
    // if iPhone strip the 's iPhone from the user name
    var user_name = cleanUserName(req.body.user);
    var feedback = req.body.feedback;

    console.log("Received from user: " + user_name + ", feedback: " + feedback);

    // build data payload to be processed
    var data = {
        "id": db.length,
        user: user_name,
        "feedback": feedback
    };

    // call translate service and then call tone analyze with result 
    translateFeedback(data, function(dataJSON) {
        toneAnalyze(dataJSON)
    });

    // send response to request
    res.end("OK");
});

app.get('/getAllData', function(req, res) {
    res.json(db);
});

app.get('/init', function(req, res) {
    seedDB();
    res.redirect('/');
});

// Load initial DB with data from external file
seedDB();


/*-------------------------
 * Functions
 *-------------------------
 */

// file initdb.json to be used to populate in memory array 
function seedDB() {
    try {
        db = JSON.parse(fs.readFileSync('initdb.json', 'utf8'));
    } catch (e) {
        console.log('Unable to load initial data, message: ' + e);
    }
}

// static server and directory to be served 
function serveStaticContent(req, res, next) {
    return express.static('public');
}

// remove iPhone stuff from user name
function cleanUserName(str) {
    var res = str.replace("’s iPhone", "");
    return res;
}

// analyze the tone of the message
function toneAnalyze(dataJSON) {
    toneAnalyzer.tone({
        'text': dataJSON.feedback,
        language: 'en'
    }, function(err, data) {
        if (err) {
        	console.log("Tone Analyzer Error ", err);
        } else {
            console.log("CHILDREN: ", data.document_tone.tone_categories[0].tones);
            var emotion = data.document_tone.tone_categories[0].tones;
            for (x in emotion) {
                dataJSON[emotion[x].tone_name] = (emotion[x].score * 100).toFixed();
            }
            dataJSON["summary"] = [dataJSON.Joy, dataJSON.Sadness, dataJSON.Anger, dataJSON.Disgust, dataJSON.Fear];
            // add entry to db array
            db.push(dataJSON);
            // send data to browser via web sockets
            io.emit('feedback', dataJSON);
        }
    });
}

// translate the message
function translateFeedback(dataJSON, callback) {
    language_translation.identify({
        text: dataJSON.feedback
    }, function(err, language) {
        if (err) {
            console.log('Translate error:', err);
        } else {
            if (language.languages[0].language == 'es' || language.languages[0].language == 'fr') {
                language_translation.translate({
                        text: dataJSON.feedback,
                        source: language.languages[0].language,
                        target: 'en'
                    },
                    function(err, translation) {
                        if (err) {
                            console.log('error:', err);
                        } else {
                            dataJSON.sourceFeedback = dataJSON.feedback;
                            dataJSON.sourceLanguage = language.languages[0].language;
                            dataJSON.feedback = translation.translations[0].translation;
                            callback(dataJSON);
                        }
                    });
            } else {
                callback(dataJSON)
            }
        }
    });
}

// start the server and listen on port
server.listen(port);
console.log("Feedback started at localhost:" + port);