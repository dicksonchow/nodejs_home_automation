$(document).ready(function() {
    chart = new Highcharts.Chart({
        chart: {
            renderTo: 'container',
            defaultSeriesType: 'spline',
        },
        title: {
            text: 'Live Room Temperature and Humidity',
            style: {"fontSize": "28px"}
        },
        exporting: {
            enabled: false
        },
        xAxis: {
            type: 'datetime',
            tickPixelInterval: 150,
            maxZoom: 20 * 1000
        },
        yAxis: {
            minPadding: 0.2,
            maxPadding: 0.2,
            title: {
                text: 'Value',
                margin: 80
            }
        },
        series: [
            {
                name: 'Temperature',
                lineWidth: 5,
                data: []
            },
            {
                name: 'Humidity',
                lineWidth: 5,
                data: [],
                color: '#f7a35c'
            }
        ]
    });

    var socket = io.connect('http://localhost:8080');
    socket.on('gettemp', function (data) {
        var temp_series = chart.series[0],
            hum_series = chart.series[1],
            shift = temp_series.data.length > 20;

        var cur_time = (new Date()).getTime();

        $.each(data, function (key, val) {
            val = parseFloat(val);

            if (key == 'temp')
                temp_series.addPoint([cur_time, val], true, shift);
            else
                hum_series.addPoint([cur_time, val], true, shift);
        });
    });
});
