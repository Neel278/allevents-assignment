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

    // jsonData = jsonData.filter(el => isDataValid(el));

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
            ${tableRowNames[10]} VARCHAR(8),
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
        let data = await conn.query(`SELECT * FROM events_data ORDER BY score DESC`)
        data = data[0];
        let obj1 = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
        const days = { "0": "Sunday", "1": "Monday", "2": "Tuesday", "3": "Wednesday", "4": "Thursday", "5": "Friday", "6": "Saturday", }
        for (let i = 0; i < data.length; i++) {
            let dayOfEvent = (new Date(data[i].start_time)).getDay(); // sunday-saturday => 0-6
            if (obj1[dayOfEvent].length < 4) {
                let tempObj = { eventname: data[i].eventname, banner_url: data[i].banner_url, day: days[dayOfEvent] }
                obj1[dayOfEvent].push(tempObj);
            }
        }
        res.json(obj1);
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