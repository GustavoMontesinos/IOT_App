# Tema

Monitoreo de sensores IoT utilizando contenedores

# Objetivos

* Desarrollar una aplicación de monitoreo de sensores IoT utilizando contenedores con NodeJs, MariaDB, Mosquitto.
* Configurar contenedores con Docker-compose.
* Programar una placa Esp32 con comunicación MQTT.

# Descripción

La empresa MPG necesita implementar una aplicación de monitoreo IoT para la presentación de datos de sensores de corriente y voltaje en tiempo real de sus paneles fotovoltaicos.

Los técnicos de la empresa han planteado la siguiente solución:

* Implementar el uso de docker-compose sobre un servidor Red Hat 8.
* Incorporar a docker-compose el uso de dockerfile para crear cada uno de los contenedores (PHP-Apache NodeJS, MariaDB y mosquitto).
* En el archivo de docker-compose establecer la red entre contenedores.
* Desarrollar una página en PHP que permita mostrar los datos en tiempo real, a través del uso NodeJS.
* Guardar los datos en la base de datos de MariaDB (Crear una base de datos con una tabla con los campos necesarios).
* La página debe mostrar los campos guardados en la base de datos y hacer uso de widgets (voltaje y corriente) para mostrar los valores de los sensores.
* Programar el esp32 para el envío de datos, a través del protocolo MQTT.
* Los puerto por los que escuchan los contenedores son: PHP-Apache NodeJs 8080, MariaDB 3306, mosquito 1883

Se solicita implementar la aplicación siguiendo estrictamente lo planteado por los técnicos de la empresa.

# Listado de equipos, materiales y o recursos:

* Máquina virtual con Red Hat 8
* Docker
* docker-compose
* Tarjeta Esp8266
* Sensores corriente y voltaje

# Desarrollo

En la siguiente figura se muestra el funcionamiento de la aplicación de monitoreo IoT.

## Creación del contenedor NodeJs

Como primer paso se necesita crear un archivo `package.json` al ejecutar el comando `npm init`donde se establecen los datos del proyecto:

```js
{
	"name": "IoT App",
	"version": "1.0.0",
	"description": "",
	"main": "index.js",
	"scripts": {
	"start": "node index.js",
	"test": "echo \"Error: no test specified\" && exit 1"
},
	"keywords": [],
	"author": "",
	"license": "ISC",
	"dependencies": {
		"dotenv": "^16.0.1",
		"express": "^4.18.1",
		"mqtt": "^4.3.7",
		"mysql": "^2.18.1",
		"socket.io": "^4.5.1"
 	}
}
```
          
### Servidor usando express

Requerir la librería express:

```js
const express = require('express')
```
Inicializar express y asignar el puerto:
```js
const app = express()
app.set('port', process.env.SERVER_PORT)
app.use(express.static(path.join(__dirname, 'public')))
```
Inicializar el servidor en el puerto asignado:
```js
const server = app.listen(app.get('port'), () => {
	console.log('server on port', app.get('port'))
})
```
### Subscriptor MQTT

Requerir la librería mqtt:

```js
const mqtt = require('mqtt')
```
Establecer el identificador MQTT y URL del Broker 

```js
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`
const connectUrl = `mqtt://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`
```
Establecer la conexión:

```js
const client = mqtt.connect(connectUrl, {
	clientId,
	clean: true,
	connectTimeout: 4000,
	reconnectPeriod: 1000,
})
```
Establecer la subscripción a un topico al conectarse al Broker:

```js
client.on('connect', () => {
	console.log('Connected')
	mqtt.client.subscribe([process.env.MQTT_TOPIC], () => {
		console.log(`Subscribed to topic ${process.env.MQTT_TOPIC}`)
	})
})
```

### Conexión a la base de datos de MariaDB
Requerir la librería mysql:

```js
const mysql = require('mysql')
```
Crear una instancia de conexión MySQL:

```js
const db = mysql.createConnection({
	host: process.env.MARIADB_HOST,
	port: process.env.MARIADB_PORT,
	user: process.env.MARIADB_USER,
	password: process.env.MARIADB_PASSWORD,
	database: process.env.MARIADB_DATABASE
})
```
Crear la conexión MySQL:

```js
db.connect((error) => {
	if (error) throw (error)
	console.log("Connected to database")
})
```

### Consulta e ingreso de datos en la base de datos de MariaDB

##### Función de inserción:

```js
function insert (data, callback) {
	let querySting =`INSERT INTO ${process.env.MARIADB_TABLE}(${data[0].id}, ${data[1].id}) VALUES (?, ?);`
	let query = mysql.format(querySting, [data[0].value, data[1].value])
	db.query(query, (error, result) => {
		if (error) throw (error)
		callback(result)
	})
}
```
##### Función de Selección:

```js
function select (callback) {
	let query = `SELECT * FROM (SELECT * FROM ${process.env.MARIADB_TABLE} ORDER BY id DESC LIMIT 4)Var1 ORDER BY id ASC;`
	db.query(query, (error, result) => {
		if (error) throw (error)
		callback(result)
	})
}
```

### Creación de websockets por medio de SocketIO

Requerir la librería SocketIO:

```js
const io = SocketIO(server)
```

Verificar nuevas conexiones con el socket:

```js
const socket_channel = io.on('connection', (socket) => {
	console.log('New Connection', socket.id)
})
```

### Recepción de datos por MQTT y envió de datos por medio de websockets.

```js
client.on('message', (topic, payload) => {
	const data_package = JSON.parse(payload.toString())
	console.log('Received Message:', topic, data_package)
	socket_channel.emit('data_package', data_package)
	db.insert(data_package)
	db.select((reult) => {
		const db_data_package = JSON.parse(JSON.stringify(reult))
		socket_channel.emit('db_data_package', db_data_package)
	})
})
```

### Sistema de archivos

#### Archivo index.js

```js
const express = require('express')
const SocketIO = require('socket.io')
const path = require('path')
const db = require('./mariadb')
const mqtt = require('./mqtt')
require("dotenv").config()
var counter
  
const app = express()
app.set('port', process.env.SERVER_PORT)
app.use(express.static(path.join(__dirname, 'public')))
  
const server = app.listen(app.get('port'), () => {
	console.log('server on port', app.get('port'))
})
  
const io = SocketIO(server)
const socket_channel = io.on('connection', (socket) => {
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
	socket_channel.emit('data_package', data_package)
	db.insert(data_package)
	db.select((reult) => {
		const db_data_package = JSON.parse(JSON.stringify(reult))
		socket_channel.emit('db_data_package', db_data_package)
	})
})
```
#### Archivo mariadb.js

```js
const mysql = require('mysql')
require("dotenv").config()
 
const db = mysql.createConnection({
	host: process.env.MARIADB_HOST,
	port: process.env.MARIADB_PORT,
	user: process.env.MARIADB_USER,
	password: process.env.MARIADB_PASSWORD,
	database: process.env.MARIADB_DATABASE
})

db.connect((error) => {
	if (error) throw (error)
	console.log("Connected to database")
})
 
exports.insert = (data, callback) => {
	let querySting = `INSERT INTO ${process.env.MARIADB_TABLE} (${data[0].id}, ${data[1].id}) VALUES (?, ?);`
	let query = mysql.format(querySting, [data[0].value, data[1].value])
	db.query(query, (error, result) => {
	if (error) throw (error)
		callback(result)
	})
}

exports.select = (callback) => {
	let query = `SELECT * FROM (SELECT * FROM ${process.env.MARIADB_TABLE} ORDER BY id DESC LIMIT 4)Var1 ORDER BY id ASC;`
	db.query(query, (error, result) => {
		if (error) throw (error)
		callback(result)
	})
}
```

#### Archivo mqtt.js

```js
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
```

### Archivo Dockerfile

``` Dockerfile
# Use an existing docker image as a base
FROM node:latest
# Download and install a dependency
WORKDIR '/usr/app'
COPY package.json .
RUN npm install -g npm@8.13.2
RUN npm install
COPY index.js mariadb.js mqtt.js ./
EXPOSE 8080
# Tell the image what to do when it starts as a container
CMD ["npm", "start"]
```
          
          

## Creación del contenedor MQTT

Para la creación de este contenedor se utiliza la imagen base oficial de “eclipse-mosquitto” que en esta ocasión cumplirá el papel de broker. 

``` Dockerfile
# Use an existing docker image as a base_
FROM_ eclipse-mosquitto:latest
# Tell the image what to do when it starts as a container_

CMD ["/usr/sbin/mosquitto", "-c", "/mosquitto/config/mosquitto.conf"]

```

La configuración inicial del broker se realiza en el archivo mosquitto.conf cuyo contenido se muestra a continuación:

``` conf
persistence true
persistence_location /mosquitto/data/
log_dest file /mosquitto/log/mosquitto.log
listener 1883
allow_anonymous true
```

## Creación del contenedor MariaDB

Para la creación de este contenedor se utiliza la imagen base oficial de “mariadb”. A esta imagen se le añade un archivo de inicialización “setup.sql”

``` Dockerfile
# Use an existing docker image as a base
FROM mariadb:latest
ADD setup.sql /docker-entrypoint-initdb.d
# Tell the image what to do when it starts as a container
CMD ["mysqld"]
```

En el archivo setup.sql se describe la creación de la base de datos “MQTT” la creación de la tabla sensores con ciertos valores iniciales.

``` sql
CREATE DATABASE MQTT;
USE MQTT;

CREATE TABLE
	IF NOT EXISTS sensores (
		id INT AUTO_INCREMENT PRIMARY KEY,
		sensor_1 INT,
		sensor_2 INT
	);
	
INSERT INTO sensores
	(sensor_1,sensor_2)
VALUES
	(556,21),
	(123,32),
	(678,23),
	(278,36),
	(375,22);
```


``` c++
#include <Arduino.h>
#include <PubSubClient.h>
#include <ESP8266WiFi.h>
#include <ArduinoJson.h>
#include <Adafruit_Sensor.h>
#include <DHT.h>

const char *ssid = "NETLIFE-MONTESINOS"; // WiFi connection info
const char *password = "KNG-@1188025145#<?>";

IPAddress mqtt_server(192, 168, 100, 104); // IP Broker
int mqtt_server_port = 1883;
unsigned long lastMsg = 0;

#define DHTTYPE DHT11
#define MSG_BUFFER_SIZE (200)
#define DHT11_PIN D7
#define pinJSK A0
  
DHT dht(DHT11_PIN, DHTTYPE);
char json_msg[MSG_BUFFER_SIZE];

WiFiClient ethClient;
PubSubClient client(ethClient);

const int capacity = JSON_OBJECT_SIZE(200) + 2 * JSON_OBJECT_SIZE(200);
StaticJsonDocument<capacity> doc;
JsonObject Sensor_01 = doc.createNestedObject();
JsonObject Sensor_02 = doc.createNestedObject();
  
void reconnect()
{
	while (!client.connected())
	{
		Serial.print("Intentando conectarse MQTT...");
		if (client.connect("arduinoClient"))
		{
			Serial.println("Conectado");
		}
		else
		{
			Serial.print("Fallo, rc=");
			Serial.print(client.state());
			Serial.println(" intentando de nuevo en 5 segundos ...");
			delay(5000); // Wait 5 seconds before retryin
		}
	}
}
 
void setup(
{
	Serial.begin(115200);
	client.setServer(mqtt_server, mqtt_server_port);

	WiFi.begin(ssid, password);
	Serial.println(" ");
	Serial.println();
	Serial.print("Connecting to ");
	Serial.println(ssid);

	while (WiFi.status() != WL_CONNECTED)
	{
		yield();
		Serial.print(".");
	}

	Serial.println("");
	Serial.println("WiFi connected");
	Serial.println(WiFi.localIP()); // Print the IP address
}

void loop()
{
	if (!client.connected())
	{
		reconnect();
	}

	client.loop();
	unsigned long now = millis();

	if (now - lastMsg > 2000)
	{
		lastMsg = now;
		Sensor_01["id"] = "sensor_1";
		Sensor_01["name"] = "joystick";
		Sensor_01["value"] = analogRead(pinJSK);
		Sensor_02["id"] = "sensor_2";
		Sensor_02["name"] = "temperature";
		Sensor_02["value"] = dht.readTemperature();

		Serial.println(doc.as<String>());

		doc.as<String>().toCharArray(json_msg, MSG_BUFFER_SIZE);
		client.publish("sensor/data", json_msg);
	}
}
```

## Docker-Compose

En el archivo Docker-Compose se describen los servicios (contenedores) y sus características como mapeo de puertos, archivos dockerfile, dependencias y volúmenes

```yml
version: "3"
services:
  nodejs:
    container_name: nodejs
    build:
      context: nodejs
      dockerfile: Dockerfile.node
    ports:
      - "8080:8080"
    volumes:
      - ./nodejs/public:/usr/app/public
    env_file:
      - ./nodejs/.env
    depends_on:
      - mqtt
      - mariadb
    networks: 
      - my-net
  mqtt:
    container_name: mqtt
    restart: always
    build:
      context: mqtt
      dockerfile: Dockerfile.mqtt
    ports:
      - "1883:1883"
    volumes:
      - ./mqtt/config:/mosquitto/config
      - ./mqtt/data:/mosquitto/data
      - ./mqtt/log:/mosquitto/log
    networks: 
      - my-net
  mariadb:
    container_name: database
    restart: always
    build:
      context: mariadb
      dockerfile: Dockerfile.database
    environment:
      - MYSQL_ROOT_PASSWORD=11221
    networks: 
      - my-net
networks:
  my-net:
    driver: bridge
```