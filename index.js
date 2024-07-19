const path = require('path');
const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron/main');
const sqlite3 = require('sqlite3');
const fs = require('fs');

let dbPath = null;
let db;
let mainWindow;


const menu = [
    {
        label: 'Fajl',
        submenu: [
            {
                label: 'Eksportuj podakte',
                submenu: [
                    {
                        label: 'Kao .json',
                    },
                    {
                        label: 'Kao .psv'
                    },
                    {
                        label: 'Kao .sqlite'
                    }
                ]
            }
        ]
    },
    {
        label: 'Dark mode'
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

function backToMainMenu(){
    console.log('Returned.');

    Menu.setApplicationMenu(mainMenu);
    mainWindow.loadFile(path.join(__dirname, './renderer/renderer.html'));
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
        }
    });

    // devtools
    mainWindow.webContents.openDevTools();

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

let last_id;

function readFileAsync(){
    return new Promise((resolve, reject) => {
        fs.readFile(user_config_path, 'utf8', (err, data) => {
            if (err){
                console.error('Error reading user_config.json.');
                reject();
            }
    
            try {
                user_config = JSON.parse(data);
                dbPath = user_config.dbPath;
                resolve();
                
            } catch (err) {
                console.error('Error parsing the JSON file:', err);
                reject();
            }
        });
    });
}


async function initDBConnection(){

    await readFileAsync();

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
    }
}


app.whenReady().then(() => {
    createMainWindow();

    initDBConnection();

    Menu.setApplicationMenu(mainMenu);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0){
            createMainWindow();
        }
    });

    ipcMain.handle('get_recent_activities', getRecentActivities);

    ipcMain.on('newActivity', (event, data) => {
        let distance = parseFloat(data[0]);
        let time = parseInt(data[1]);
        let date = data[2];
        
        // not rigorous enough
        // let last_id = parseInt(data[3]);
        let pace = `${Math.floor((time/distance)/60).toString().padStart(2, '0')}:${Math.round((time/distance)%60).toString().padStart(2, '0')} /km`;

        console.log('Neposredno: ' + last_id);
        const sql = "INSERT INTO activity(activity_id, activity_date, distance, activity_time, pace) VALUES(?, ?, ?, ?, ?);"
        db.run(sql, [last_id, date, distance, time, pace], function(err) {
            if (err) {
                console.error('Error inserting new activity: ', err.message);
            } else {
                console.log(`A new row has been inserted with rowid ${last_id}`);
                last_id++;
            }
        });
    });

    ipcMain.on('undoActivity', () => {
        const query = "DELETE FROM activity WHERE activity_id = (SELECT activity_id FROM activity ORDER BY activity_id DESC LIMIT 1);";
        db.run(query, function(err){
            if (err) {
                console.error('Error deleting activity: ', err.message);
            } else {
                last_id--;
                console.log(`Last entry deleted.`);
            }
        });
    });

    ipcMain.on('returnFocus', () => {
        mainWindow.focus();
    });
});

app.on('before-quit', () => {
    if (db){
        db.close();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin'){
        app.quit();
    }
});