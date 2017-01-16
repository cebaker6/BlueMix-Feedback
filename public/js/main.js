$(document).ready(function() {
    $('#loading_wrap').remove();
    var socket = io();
    socket.on('feedback', appendFeedback);
});

$('#maintable').bootstrapTable({
    onLoadSuccess: function() {
        drawGraphs();
    }
});

// process feedback received from server
function appendFeedback(data) {
    console.log(data);
    $('#maintable').bootstrapTable('append', data);
    drawGraphs();
}

// format graph ares in HTML table
function graphFormatter(value, row, index) {
    return [
        '<canvas width="500" height="80" id="graphDiv' + row.id + "-" + index + '">' + value + '</canvas>'
    ].join('');
}

// format feedback text in HTML table
function feedbackFormatter(value, row, index) {
    var output = "" + value;
    if (row.sourceLanguage) {
        var sourceFeedback = "" + escape(row.sourceFeedback);
        output += ' <span class = "feedbackSpan" style="color:#4178be;" '
        output += 'title="' + row.sourceFeedback + '"';
        output += 'onclick=this.innerHTML=decodeURI("[' + sourceFeedback + ']")';
        output += '>';
        output += '[Translated from ';
        output += row.sourceLanguage + ']'
        output += '</span>';
    }
    return output;
}

// draw graph with tone analytics returned values using canvas and Chart.js
function drawGraphs() {
    $("canvas[id^='graphDiv']").each(function() {
        var value = $(this).html().split(",");
        var myDom = this;
        var ctx = document.getElementById($(this).attr('id')).getContext("2d");
        var strokeColor = "rgba(100,150,200,1)";
        var data = {
            labels: ["Joy", "Sad", "Mad", "Disgust", "Fear"],
            datasets: [{
                    label: "Tone info",
                    fillColor: strokeColor,
                    strokeColor: strokeColor,
                    pointColor: "rgba(220,220,220,1)",
                    pointStrokeColor: "#fff",
                    pointHighlightFill: "#fff",
                    pointHighlightStroke: "rgba(220,220,220,1)",
                    data: value
                },
            ]
        };
        var myLineChart = new Chart(ctx).Bar(data, {
            bezierCurve: true,
            pointDot: true,
            showScale: true,
            barValueSpacing: 10
        });

    });
};

// reset browser to initial db values
function resetData() {
    $.get("/init", {}, function(data) {
        location.reload();
    });
}

