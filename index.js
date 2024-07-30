const path = require('path');
const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron/main');
const sqlite3 = require('sqlite3');
const fs = require('fs');
const os = require('os');

let dbPath = null;
let db;
let mainWindow;


let menu = [
    {
        label: 'Fajl',
        submenu: [
            {
                label: 'Eksportuj podakte',
                submenu: [
                    {
                        label: 'Kao .json',
                        click: () => exportData(1)
                    },
                    {
                        label: 'Kao .psv',
                        click: () => exportData(2)
                    },
                    {
                        label: 'Kao .sqlite',
                        click: () => exportData(3)
                    }
                ]
            }
        ]
    },
    {
        label: 'Dark mode',
        click: switchDisplayMode
    },
    {
        label: 'O programu',
        click: openAboutPage
    }
];

const nonMainMenu = [
    {
        label: 'Nazad',
        click: backToMainMenu
    }
];

const mainMenu = Menu.buildFromTemplate(menu);
const otherMenu = Menu.buildFromTemplate(nonMainMenu);

async function get_table_data(){
    let sql = ['SELECT * FROM activity', 'SELECT * FROM personal_record', 'SELECT * FROM pr_category'];
    let ret = [];

    return new Promise((resolve, reject) => {
        db.all(sql[0], (err, data) => {
            if (err) {
                console.error('Error running query: ', err);
                reject(err);
            }
            ret.push(data);

            db.all(sql[1], (err, data) => {
                if (err){
                    console.error('Error running query: ', err);
                    reject(err);
                }
                ret.push(data);
    
                db.all(sql[2], (err, data) => {
                    if (err){
                        console.error('Error running query: ', err);
                        reject(err);
                    }

                    ret.push(data);
                    resolve(ret);
                });
            });
        });
    });
}

async function exportData(option){
    let desktop_path = path.join(os.homedir(), 'Desktop');
    let unix_time = Math.floor(Date.now() / 1000);

    let res = await get_table_data();
    let paths = ['activity.json', 'personal_record.json', 'pr_category.json'];
    let paths_psv = ['activity.psv', 'personal_record.psv', 'pr_category.psv'];

    let dir_path;

    switch (option){
        case 1:
            // JSON
            dir_path = path.join(desktop_path, 'trcanje_export_json_' + unix_time.toString());
            fs.mkdir(dir_path, { recursive: true }, (err) => {
                if (err){
                    dialog.showMessageBox(mainWindow, {
                        type: 'warning',
                        buttons: ['OK'],
                        defaultId: 0,
                        title: 'Neuspeh',
                        message: 'Neuspeh!',
                        detail: `Neuspešan izvoz podataka u JSON format.`
                    });
                }

                for (let i = 0; i < res.length; i++){
                    paths[i] = path.join(dir_path, paths[i]);
                    fs.writeFileSync(paths[i], JSON.stringify(res[i], null, 2), 'utf8');
                }
            });

            dialog.showMessageBox(mainWindow, {
                type: 'info',
                buttons: ['OK'],
                defaultId: 0,
                title: 'Uspešno',
                message: 'Uspešno napravljena JSON rezervna kopija',
                detail: `Kopiran fajl "${dbPath}" na lokaciju "${desktop_path}".`
            });
            break;
        case 2:
            // PSV
            dir_path = path.join(desktop_path, 'trcanje_export_psv_' + unix_time.toString());
            fs.mkdir(dir_path, { recursive: true }, (err) => {
                if (err){
                    dialog.showMessageBox(mainWindow, {
                        type: 'warning',
                        buttons: ['OK'],
                        defaultId: 0,
                        title: 'Neuspeh',
                        message: 'Neuspeh!',
                        detail: `Neuspešan izvoz podataka u PSV format.`
                    });
                }

                for (let i = 0; i < res.length; i++){
                    let res_len = res[i].length;
                    let temp = '';
                    
                    for (let j = 0; j < res_len; j++){
                        let element = res[i][j];
                        for (let key in element){
                            if (element.hasOwnProperty(key)){
                                temp += element[key];
                                temp += '|'; 
                            }
                        }
                        temp = temp.slice(0, -1);
                        temp += '\n';
                    }

                    //write to file
                    paths_psv[i] = path.join(dir_path, paths_psv[i]);
                    fs.writeFileSync(paths_psv[i], temp, 'utf8');
                }
            });

            dialog.showMessageBox(mainWindow, {
                type: 'info',
                buttons: ['OK'],
                defaultId: 0,
                title: 'Uspešno',
                message: 'Uspešno napravljena PSV rezervna kopija',
                detail: `Kopiran fajl "${dbPath}" na lokaciju "${desktop_path}".`
            });

            break;
        case 3:
            // SQLITE
            desktop_path = path.join(desktop_path, 'trcanje_export_' + unix_time.toString() + '.sqlite3');
            fs.copyFile(dbPath, desktop_path, (err) => {
                if (err) {
                    console.error('Error copying file:', err);
                } else {
                    dialog.showMessageBox(mainWindow, {
                        type: 'info',
                        buttons: ['OK'],
                        defaultId: 0,
                        title: 'Uspešno',
                        message: 'Uspešno napravljena rezervna kopija',
                        detail: `Kopiran fajl "${dbPath}" na lokaciju "${desktop_path}".`
                    });
                }
            });
            break;
    }
    console.log(desktop_path);
}

async function backToMainMenu(){
    console.log('Returned.');

    Menu.setApplicationMenu(mainMenu);
    mainWindow.loadFile(path.join(__dirname, './renderer/renderer.html'));
}

function switchDisplayMode(){
    darkMode = !darkMode;
    user_config.darkMode = darkMode;

    const mode_label = darkMode ? 'Light mode' : 'Dark mode';
    const menu_item = menu.find(item => item.click === switchDisplayMode);
    if (menu_item){
        menu_item.label = mode_label;
        Menu.setApplicationMenu(Menu.buildFromTemplate(menu));
    }

    fs.writeFileSync(user_config_path, JSON.stringify(user_config, null, 2), 'utf8');

    mainWindow.webContents.reload();
}

function openAboutPage(){

    console.log('Opened about page.');

    Menu.setApplicationMenu(otherMenu);
    mainWindow.loadFile(path.join(__dirname, './renderer/about.html'));
}

function createMainWindow() {
    mainWindow = new BrowserWindow({
        title: 'Trčanje',
        width: 1400,
        height: 900,
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), // Use preload script for IPC
            nodeIntegration: false,
            contextIsolation: true,
        },
        icon: path.join(__dirname, 'running_icon2.png')
    });

    // devtools
    // mainWindow.webContents.openDevTools();

    mainWindow.loadFile(path.join(__dirname, './renderer/renderer.html'));
}


app.on('ready', () => {
    
});

async function getRecentActivities() {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM activity ORDER BY activity_date DESC, distance DESC', (err, rows) => {
            if (err) {
                console.error('Error running query: ', err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

let user_config;
let user_config_path = path.join(__dirname, 'user_config.json');

let selectedTimeframe;
let selectedDistance;
let darkMode;

let last_id;

function readUserConfig(){
    return new Promise((resolve, reject) => {
        fs.readFile(user_config_path, 'utf8', (err, data) => {
            if (err){
                console.error('Error reading user_config.json.');
                reject();
            }
    
            try {
                user_config = JSON.parse(data);
                dbPath = user_config.dbPath;
                selectedTimeframe = user_config.selectedTimeframe;
                selectedDistance = user_config.selectedDistance;
                darkMode = user_config.darkMode;
                resolve();
                
            } catch (err) {
                console.error('Error parsing the JSON file:', err);
                reject();
            }
        });
    });
}

let last_pr_id;

async function initDBConnection(){

    await readUserConfig();

    if (!fs.existsSync(dbPath)) {
        dialog.showMessageBox(mainWindow, {
            type: 'warning',
            buttons: ['OK'],
            defaultId: 0,
            title: 'Upozorenje',
            message: 'Ne postoji .db fajl.',
            detail: 'Ili ne postoji definisana putanja do .db fajla, ili postojeća putanja nije validna. Posle što klikneš \'OK\', selektuj u kom direktorijumu želiš da sačuvaš bazu podataka.'
        }).then(result => {
            dialog.showOpenDialog(mainWindow, {
                properties: ['openFile', 'openDirectory']
            }).then(result => {
                // DIRECTORY ENTERED
                dbPath = path.join(result.filePaths[0], 'trcanje.sqlite3');
                user_config.dbPath = dbPath;
                fs.writeFileSync(user_config_path, JSON.stringify(user_config, null, 2), 'utf8');

                fs.writeFile(dbPath, '', (err, data) => {
                    if (err){
                        console.error(`Error creating sqlite3 file. Path: ${dbPath}`);
                    } else {
                        console.log(`${dbPath} created successfully.`);
                    }
                });

                db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
                    if (err) {
                        console.error('Database connection failed:', err.message);
                    } else {
                        console.log('Connected to SQLite database');
                    }
                });

                // CREATING TABLES
                db.run(`CREATE TABLE activity (
                        activity_id INT IDENTITY(1,1) NOT NULL,
                        activity_date DATE NOT NULL,
                        distance REAL NOT NULL,
                        activity_time INT NOT NULL,
                        pace NVARCHAR(10) NOT NULL,
                        PRIMARY KEY (activity_id)
                    );`, (err) => {
                    if (err) {
                        console.error(err.message);
                    } else {
                        console.log('Table created.');
                    }
                });

                db.run(`CREATE TABLE pr_category (
                        pr_cat_id INT IDENTITY(1,1) NOT NULL,
                        pr_cat_desc NVARCHAR(200) NOT NULL,
                        pr_cat_distance REAL NOT NULL,
                        PRIMARY KEY (pr_cat_id)
                );`, (err) => {
                if (err) {
                    console.error(err.message);
                } else {
                    console.log('Table created.');
                }
                });

                db.run(`CREATE TABLE personal_record (
                        pr_id INT IDENTITY(1,1) NOT NULL,
                        pr_date DATE NOT NULL,
                        pr_cat_id NVARCHAR(200) NOT NULL,
                        pr_time INT NOT NULL,
                        pr_pace NVARCHAR(10) NOT NULL,
                        PRIMARY KEY (pr_id),
                        CONSTRAINT fk_personal_record_pr_cat_id FOREIGN KEY (pr_cat_id) REFERENCES pr_category(pr_cat_id)
                );`, (err) => {
                if (err) {
                    console.error(err.message);
                } else {
                    console.log('Table created.');

                    // data
                    const insertStmt = db.prepare(`INSERT INTO pr_category (pr_cat_id, pr_cat_desc, pr_cat_distance) VALUES
                        (1, '1 K', 1),
                        (2, '1 MI', 1.6),
                        (3, '5 K', 5),
                        (4, '10 K', 10),
                        (5, '15 K', 15),
                        (6, 'Polumaraton', 21),
                        (7, '30 K', 30),
                        (8, 'Maraton', 42),
                        (9, '50 K', 50),
                        (10, '100 K', 100),
                        (11, '200 K', 200);`
                    );

                    insertStmt.run((err) => {
                        if (err){
                            console.log(err.message);
                        } else {
                            console.log('Data inserted.')
                        }
                    });

                    insertStmt.finalize();

                    mainWindow.webContents.reload();
                }
                });

                last_id = 1;
            }).catch(err => {
                console.log(err)
            });
        }).catch(err => {
            console.log(err);
        });
    } else {
        db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
            if (err) {
                console.error('Database connection failed:', err.message);
            } else {
                console.log('Connected to SQLite database');
            }
        });

        db.all('SELECT * FROM activity ORDER BY activity_id DESC LIMIT 1', (err, rows) => {
            if (err) {
                console.error('Error running query: ', err);
            } else {
                if (rows === undefined || rows.length == 0){
                    last_id = 1;
                } else {
                    last_id = rows[0].activity_id + 1;
                }
            }
        });

        db.all('SELECT pr_id FROM personal_record ORDER BY pr_id DESC LIMIT 1', (err, rows) => {
            if (err){
                console.error('Error trying to get last pr_id: ', err);
            } else {
                if (rows === undefined || rows.length == 0){
                    last_pr_id = 1;
                } else {
                    last_pr_id = rows[0].pr_id + 1;
                }
            }
        });
    }
}

function getUndoResponse(){
    const query = "DELETE FROM activity WHERE activity_id = (SELECT activity_id FROM activity ORDER BY activity_id DESC LIMIT 1);";
    db.run(query, function(err){
        if (err) {
            console.error('Error deleting activity: ', err.message);
        } else {
            if (last_id === 1){
                console.log('Nothing left to delete.');
            } else {
                last_id--;
                console.log(`Most recent entry deleted.`);
            }
        }
    });

    return last_id;
}

function getUndoResponsePR(){
    const query = "DELETE FROM personal_record WHERE pr_id = (SELECT pr_id FROM personal_record ORDER BY pr_id DESC LIMIT 1)";
    db.run(query, function(err){
        if (err) {
            console.error('Error deleting activity: ', err.message);
        } else {
            if (last_pr_id === 1){
                console.log('Nothing left to delete.');
            } else {
                last_pr_id--;
                console.log(`Most recent entry deleted.`);
            }
        }
    });

    console.log(last_pr_id);
    return last_pr_id;
}

async function get_PR_cat_data(){
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM pr_category', (err, data) => {
            if (err) {
                console.error('Error running query: ', err);
                reject(err);
            }
            resolve(data);
        });
    });
}

async function get_query_data(sql, params){
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err){
                reject(err);
            }

            resolve(rows);
        });
    });
}

async function getPRdata(){
    let pr_cat_data = await get_PR_cat_data();
    let pr_cat_len = pr_cat_data[pr_cat_data.length - 1].pr_cat_id;

    let formatted = [];
    let sql = `SELECT * FROM personal_record WHERE pr_cat_id = ? ORDER BY pr_time ASC LIMIT 1`;
    
    for (let i = 0; i < pr_cat_len; i++){

        let temp_el = {
            'cat_data': '',
            'time': '',
            'pace': '',
            'pr_id': 0
        };

        let row = await get_query_data(sql, [pr_cat_data[i].pr_cat_id]);
        row = row[0];

        if (row === undefined){
            temp_el.cat_data = pr_cat_data[i];
            temp_el.time = 'n/a';
            temp_el.pace = 'n/a';
            temp_el.pr_id = -1;
        } else {
            let formatted_time = '';
            if (row.pr_time < 3600){
                formatted_time = `${Math.floor(row.pr_time/60).toString().padStart(1, '0')}:${(row.pr_time%60).toString().padStart(2, '0')}`;
            } else {
                formatted_time = `${Math.floor(row.pr_time/3600).toString().padStart(1, '0')}:${Math.floor((row.pr_time%3600)/60).toString().padStart(2, '0')}:${(row.pr_time%60).toString().padStart(2, '0')}`;
            }

            let formatted_pace = row.pr_pace[0] === '0' ? row.pr_pace.slice(1) : row.pr_pace;

            temp_el.cat_data = pr_cat_data[i];
            temp_el.time = formatted_time;
            temp_el.pace = formatted_pace;
            temp_el.pr_id = row.pr_id;
        }
        
        formatted.push(temp_el);
    }

    return formatted;
}

function get_pr_cat_id(pr_desc){
    return new Promise((resolve, reject) => {
        db.all('SELECT pr_cat_distance FROM pr_category WHERE pr_cat_desc = ?', pr_desc, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

async function initApp(){
    createMainWindow();
    await initDBConnection();

    const mode_label = darkMode ? 'Light mode' : 'Dark mode';
    const menu_item = menu.find(item => item.click === switchDisplayMode);
    if (menu_item){
        menu_item.label = mode_label;
    }

    Menu.setApplicationMenu(Menu.buildFromTemplate(menu));

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0){
            createMainWindow();
        }
    });

    ipcMain.handle('get-pr-date', async (event, argument) => {
        return new Promise((resolve, reject) => {
            db.all('SELECT pr_date FROM personal_record WHERE pr_id = ?', argument, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    });

    ipcMain.handle('get_recent_activities', getRecentActivities);

    ipcMain.handle('get-pr-data', getPRdata);

    ipcMain.handle('get-json-info', (event, ...args) => {
        return [selectedTimeframe, selectedDistance, darkMode];
    });

    ipcMain.handle('get-undo-response-pr', getUndoResponsePR);

    ipcMain.handle('get-undo-response', getUndoResponse);

    ipcMain.on('newPR', (event, data) => {
        
        let pr_description = data[0];
        let time = data[1];
        let distance;

        get_pr_cat_id(pr_description)
        .then(rows => {
            distance = parseFloat(rows[0].pr_cat_distance);

            let pace = `${Math.floor((time/distance)/60).toString().padStart(2, '0')}:${Math.round((time/distance)%60).toString().padStart(2, '0')} /km`;

            let now = new Date();
            let date = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;

            if (last_pr_id == null){
                last_pr_id = 1;
            }
            
            const sql = 'INSERT INTO personal_record(pr_id, pr_date, pr_cat_id, pr_time, pr_pace) VALUES(?, ?, (SELECT pr_cat_id FROM pr_category WHERE pr_cat_desc = ?), ?, ?);';
            db.run(sql, [last_pr_id, date, pr_description, time, pace], function(err) {
                if (err) {
                    console.error('Error inserting new personal record: ', err.message);
                } else {
                    console.log(`A new personal best has been inserted with id ${last_pr_id}`);
                    last_pr_id++;
                }
            });
        })
        .catch(err => {
            console.error(err);
        });
    });

    ipcMain.on('change-sel-timeframe', (event, data) => {
        user_config.selectedTimeframe = data;
    });

    ipcMain.on('change-sel-distance', (event, data) => {
        user_config.selectedDistance = data;
    });

    ipcMain.on('newActivity', (event, data) => {
        let distance = parseFloat(data[0]);
        let time = parseInt(data[1]);
        let date = data[2];
        
        let pace = `${Math.floor((time/distance)/60).toString().padStart(2, '0')}:${Math.round((time/distance)%60).toString().padStart(2, '0')} /km`;

        const sql = "INSERT INTO activity(activity_id, activity_date, distance, activity_time, pace) VALUES(?, ?, ?, ?, ?);";
        db.run(sql, [last_id, date, distance, time, pace], function(err) {
            if (err) {
                console.error('Error inserting new activity: ', err.message);
            } else {
                console.log(`A new row has been inserted with rowid ${last_id}`);
                last_id++;
            }
        });
    });

    ipcMain.on('returnFocus', () => {
        mainWindow.focus();
    });
}

app.whenReady().then(initApp);

app.on('before-quit', () => {

    if (db){
        db.close();
    }

    fs.writeFile(user_config_path, JSON.stringify(user_config, null, 2), 'utf8', (err) => {
        if (err) {
            console.error('Error saving user config:', err);
        } else {
            console.log('User config saved successfully.');
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin'){
        app.quit();
    }
});