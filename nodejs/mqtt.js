const mqtt = require('mqtt')
require("dotenv").config()

const clientId = `mqtt_${Math.random().toString(16).slice(3)}`
const connectUrl = `mqtt://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`

exports.client = mqtt.connect(connectUrl, {
  clientId,
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 1000,
})
