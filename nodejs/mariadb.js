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
    let querySting = `INSERT INTO ${process.env.MARIADB_TABLE}(${data[0].id}, ${data[1].id}) VALUES (?, ?);`
    let query = mysql.format(querySting, [data[0].value, data[1].value])
    db.query(query, (error, result) => {
        if (error) throw (error)
        if(callback) callback(result)
    })
}

exports.select = (callback) => {
    let query = `SELECT * FROM (SELECT * FROM ${process.env.MARIADB_TABLE} ORDER BY id DESC LIMIT 4)Var1 ORDER BY id ASC;`
    db.query(query, (error, result) => {
        if (error) throw (error)
        if(callback) callback(result)
    })
}