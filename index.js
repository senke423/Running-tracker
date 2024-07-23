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

function exportData(option){
    let desktop_path = path.join(os.homedir(), 'Desktop');
    let unix_time = Math.floor(Date.now() / 1000);
    switch (option){
        case 1:
            // JSON
            desktop_path = path.join(desktop_path, 'trcanje_export_' + unix_time.toString() + '.json');
            break;
        case 2:
            // PSV
            desktop_path = path.join(desktop_path, 'trcanje_export_' + unix_time.toString() + '.psv');
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
                        detail: `Kopiran fajl ${dbPath} na lokaciju ${desktop_path}.`
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
                console.log('DIR ENTERED!\n');

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

async function getRecordData(sql, params){
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                return reject(err);
            }
            resolve(row);
        });
    });
}

async function getPRdata(){
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM pr_category', (err, data) => {
            if (err) {
                console.error('Error running query: ', err);
                reject(err);
            }

            let pr_categories = data;
            let formatted = [];

            let number_of_categories = pr_categories[pr_categories.length - 1].pr_cat_id;
            let sql = `SELECT * FROM personal_record WHERE pr_cat_id = ? ORDER BY pr_time ASC LIMIT 1`;
            
            try {
                for (let i = 0; i < number_of_categories; i++){

                    let temp_el = {
                        'cat_name': '',
                        'time': '',
                        'pace': ''
                    };
                    formatted.push(temp_el);

                    // let data = await getRecordData(sql, [i]);
                }
            } catch (err){
                console.error(err);
                reject(err);
            }

            console.log('FINAL LOOK:');
            console.log(formatted);
            resolve(formatted);
            
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

    ipcMain.handle('get_recent_activities', getRecentActivities);

    ipcMain.handle('get-pr-data', getPRdata);

    ipcMain.handle('get-json-info', (event, ...args) => {
        return [selectedTimeframe, selectedDistance, darkMode];
    });

    ipcMain.handle('get-undo-response', getUndoResponse);

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
        
        // not rigorous enough
        // let last_id = parseInt(data[3]);
        let pace = `${Math.floor((time/distance)/60).toString().padStart(2, '0')}:${Math.round((time/distance)%60).toString().padStart(2, '0')} /km`;

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