const router = require('express').Router();
const csvToJson = require('csvtojson')();
const mysql = require('mysql2/promise');
const { isDataValid } = require('../helpers');
const { decode } = require('html-entities');

// db connection
let conn;
(async function () {
    conn = await mysql.createConnection({
        // please provide password if you have any
        host: 'sql6.freesqldatabase.com',
        user: 'sql6502209',
        database: 'sql6502209',
        password: 'bdDGHWmRmq'
    })
})()

// routes
router.get('/', (req, res) => {
    res.send("Hello World!")
})

router.post('/syncData', async (req, res) => {
    // read file using csvtojson
    let jsonData = await csvToJson.fromFile(__dirname + '/../files/backend_task_sample_data.csv')

    // get all keys to create table accordingly
    const tableRowNames = Object.keys(jsonData[0]);
    try {
        // check if events_data table exists if not than create it
        await conn.query(`
        CREATE TABLE IF NOT EXISTS events_data (
            id INT NOT NULL AUTO_INCREMENT,
            ${tableRowNames[0]} VARCHAR(255),
            ${tableRowNames[1]} VARCHAR(255),
            ${tableRowNames[2]} VARCHAR(255),
            ${tableRowNames[3]} VARCHAR(255),
            ${tableRowNames[4]} VARCHAR(8),
            ${tableRowNames[5]} VARCHAR(128),
            ${tableRowNames[6]} VARCHAR(16),
            ${tableRowNames[7]} VARCHAR(64),
            ${tableRowNames[8]} TEXT,
            ${tableRowNames[9]} VARCHAR(512),
            ${tableRowNames[10]} FLOAT(8),
            ${tableRowNames[11]} VARCHAR(512),
            PRIMARY KEY (id)
        );
    `)
        let ans = [];
        for (let i = 0; i < jsonData.length; i++) {
            jsonData[i].description = `${decode(jsonData[i].description)}`;
            if (isDataValid(jsonData[i])) {
                const data = Object.values(jsonData[i]);
                // store readed to sql using mysql2
                ans.push(conn.query("INSERT INTO `events_data`(`event_id`, `eventname`, `start_time`, `end_time`, `timezone`, `city`, `state`, `country`, `description`, `banner_url`, `score`, `categories`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", data))
            }
        }
        try {
            await Promise.all(ans)
        } catch (err) {
            console.log(err);
        }
        res.json("data inserted successfully");
    } catch (err) {
        console.log(err);
        res.json('data insertion failed')
    }
})

router.get('/getEvents', async (req, res) => {
    try {
        // For older version of mysql
        let data = await conn.query(`
        (SELECT id,eventname,banner_url FROM events_data WHERE (DATE(start_time) >= CURDATE() AND DATE(start_time) <= CURDATE()+7) AND (DAYOFWEEK(start_time) = 1) ORDER BY score DESC LIMIT 4)
        UNION 
        (SELECT id,eventname,banner_url FROM events_data WHERE (DATE(start_time) >= CURDATE() AND DATE(start_time) <= CURDATE()+7) AND (DAYOFWEEK(start_time) = 6) ORDER BY score DESC LIMIT 4)
        UNION 
        (SELECT id,eventname,banner_url FROM events_data WHERE (DATE(start_time) >= CURDATE() AND DATE(start_time) <= CURDATE()+7) AND (DAYOFWEEK(start_time) = 7) ORDER BY score DESC LIMIT 4)
        `)
        // Note:- You can use below query for newer version of mysql
        // let data = await conn.query(`
        //             SELECT id,eventname,banner_url FROM (SELECT *,ROW_NUMBER() OVER (PARTITION BY DAYOFWEEK(start_time) ORDER BY DAYOFWEEK(start_time),score DESC) AS RN FROM events_data WHERE DAYOFWEEK(start_time) IN (1,6,7) AND (start_time BETWEEN CURDATE() AND CURDATE()+7)) sub WHERE RN <= CASE DAYOFWEEK(start_time) WHEN 1 THEN 4 WHEN 6 THEN 4 WHEN 7 THEN 4 END
        // `)
        let obj = {
            "Sunday": data[0].slice(0, 4),
            "Friday": data[0].slice(4, 8),
            "Saturday": data[0].slice(8, 12),
        }
        res.json(obj);
    } catch (e) {
        console.log(e)
    }
})

router.get('/getEventsCount', async (req, res) => {
    try {
        let data = await conn.query(`SELECT eventname,description FROM events_data ORDER BY score DESC`)
        data = data[0]
        let ans = [];
        for (let i = 0; i < data.length; i++) {
            // make substring from eventname
            const splitData = data[i].eventname.split(' ');
            // search for those substrings avaibility inside descirption
            for (let key of splitData) {
                if (data[i].description.includes(key)) ans.push(key);
            }
        }
        for (let i = 0; i < ans.length; i++) {
            if (!(/^[A-Z]{1}[a-zA-Z]{2,}$/g.test(ans[i]))) {
                ans[i] = null;
            }
        }
        let obj = {};
        for (let key of ans) {
            if (key != null || key != '') {
                if (obj[key] == null) obj[key] = 1;
                obj[key] = ++obj[key];
            }
        }
        delete obj['null'];
        for (let key of Object.keys(obj)) {
            if (obj[key] < 10) {
                delete obj[key];
            }
        }
        res.send(obj);
    } catch (e) {
        console.error(e);
    }
})

module.exports = router;
