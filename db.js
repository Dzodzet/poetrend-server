const mysql = require('mysql');

let connection;

const open = function (host, user, password, database) {
    connection = mysql.createConnection({
        host,
        user,
        password,
        database,
        timezone: 'utc'
    });
    connection.connect(function (err) {
        if (err) {
            console.error('Error while trying to connect: ' + err.stack);
            return;
        }
        console.log('connected as id ' + connection.threadId);
    });
};

const close = function () {
    connection.end();
};

const get = function (query, vals, callback) {
    try {
        connection.query(query, vals, function (error, results, fields) {
            
            callback(results);
        });
    } catch (error) {
        console.log(error);
        callback(false);
    }
}

module.exports = {
    open,
    close,
    get
}