const express = require('express')
const SocketIO = require('socket.io')
const path = require('path')
const db = require('./mariadb')
const mqtt = require('./mqtt')
require("dotenv").config()

const app = express()
app.set('port', process.env.SERVER_PORT)
app.use(express.static(path.join(__dirname, 'public')))

//initialize server
const server = app.listen(app.get('port'), () => {
    console.log('server on port', app.get('port'))
})

//Websockets
const io = SocketIO(server)
const socket = io.on('connection', (socket) => {
    console.log('New Connection', socket.id)
})

mqtt.client.on('connect', () => {
    console.log('Connected')
    mqtt.client.subscribe([process.env.MQTT_TOPIC], () => {
        console.log(`Subscribed to topic ${process.env.MQTT_TOPIC}`)
    })
})

mqtt.client.on('message', (topic, payload) => {
    const data_package = JSON.parse(payload.toString())
    console.log('Received Message:', topic, data_package)
    socket.emit('data_package', data_package)
    db.insert(data_package, (reult) => {
        console.log(reult)
    })
    db.select((reult) => {
        const db_data_package = JSON.parse(JSON.stringify(reult))
        socket.emit('db_data_package', db_data_package)
        console.log(reult)
    })
})