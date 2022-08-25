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
