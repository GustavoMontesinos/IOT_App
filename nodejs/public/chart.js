const socket = io()

const options_circular = {
    scale: {
        startValue: 0,
        endValue: 1000,
        label: {
            font: {
                size: 14,
                color: '#ffffff'
            },
        },
        tick: {
            color: '#ffffff',
        },
        minorTick: {
            color: '#ffffff',
            visible: true,
        },
        tickInterval: 100,
        minorTickInterval: 10,
    },
    rangeContainer: {
        backgroundColor: 'none',
    },
    title: {
        text: 'Joystik "Y" Position',
        font: {
            size: 24,
            color: '#ffffff'
        },
    },
    valueIndicator: {
        type: 'rectangularNeedle',
        // type: 'rangebar',
        color: '#7CADE9',
    },
    value: 451
}

const options_linear = {
    geometry: {
        orientation: 'vertical'
    },
    scale: {
        startValue: 0,
        endValue: 100,
        label: {
            font: {
                size: 14,
                color: '#ffffff'
            },
        },
        tick: {
            color: '#ffffff',
        },
        minorTick: {
            color: '#ffffff',
            visible: true,
        },
        tickInterval: 10,
        minorTickInterval: 5,
    },
    tooltip: {
        enabled: true,
        customizeTooltip(arg) {
            return {
                text: `${arg.valueText}`,
            };
        },
        font: {
            color: 'black',
            size: 12,
        },
    },
    rangeContainer: {
        backgroundColor: 'none',
    },
    title: {
        text: 'Joystik Y Position',
        font: {
            size: 16,
            color: '#ffffff'
        },
    },
    valueIndicator: {
        type: 'rangebar',
        color: '#7CADE9',
    },
    value: 51
}

function update(chart, chart2) {
    socket.on('data_package', (data) => {
        console.log(data)
        chart.option({ "value": data[0].value })
        chart2.option({ "value": data[1].value })
        const span = document.getElementById("span")
        span.textContent = data[0].value
    });
}

document.addEventListener("DOMContentLoaded", () => {
    w1 = document.getElementById("widget")
    w1 = document.getElementById("widget2")
    const gaugeDev = new DevExpress.viz.dxCircularGauge(w1, options_circular);
    const gaugeDev2 = new DevExpress.viz.dxLinearGauge(w2, options_linear);
    update(gaugeDev, gaugeDev2)
});
