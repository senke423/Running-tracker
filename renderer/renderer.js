
let activityHistoryData;
let pr_data;
let JSON_info;
let stayBlack = false;
let last_id;

let xVals;
let yVals;
let running_chart;

let available_years = [];

const error_sound = new Audio('./assets/sounds/error.ogg');
const success_sound = new Audio('./assets/sounds/success.ogg');
const click_sound = new Audio('./assets/sounds/click.ogg');

let combo_box;

let selected_timeframe;
let selected_distance;
let selected_mode;

let thisMonday;
let thisSunday;

let chart_data = {
    "distance_data": {
        "this_week": {
            "x": [],
            "y": []
        },
        "weekly": {
            "x": [],
            "y": [0, 0, 0, 0, 0, 0, 0, 0]
        },
        "monthly": {
            "x": [],
            "y": {}
        }
    },
    "time_data": {
        "this_week": {
            "x": [],
            "y": []
        },
        "weekly": {
            "x": [],
            "y": [0, 0, 0, 0, 0, 0, 0, 0]
        },
        "monthly": {
            "x": [],
            "y": {}
        }
    }
};

let option_this_week;
let option_weekly;
let option_monthly;
let option_distance;
let option_time;

let monday_8_weeks_ago;
let last_sunday;
let past_8_weeks_periods = {
    1: {
        'monday': '',
        'sunday': ''
    },
    2: {
        'monday': '',
        'sunday': ''
    },
    3: {
        'monday': '',
        'sunday': ''
    },
    4: {
        'monday': '',
        'sunday': ''
    },
    5: {
        'monday': '',
        'sunday': ''
    },
    6: {
        'monday': '',
        'sunday': ''
    },
    7: {
        'monday': '',
        'sunday': ''
    },
    8: {
        'monday': '',
        'sunday': ''
    }
};

let selected_year;
let pr_description;
let time_string;
let text_box_id;
let placeholder_vals = {};

window.onclick = function(event) {
    let modal = document.getElementById("myModal");
    if (event.target == modal) {
      modal.style.display = "none";
    }
}

window.onload = async function() {

    let display_mode = document.getElementById('display_mode');
    option_this_week = document.getElementById('thisweek');
    option_weekly = document.getElementById('weekly');
    option_monthly = document.getElementById('monthly');
    option_distance = document.getElementById('distanceOption');
    option_time = document.getElementById('timeOption');
    combo_box = document.getElementById('yearSelect');

    // monday_8_weeks_ago is global because it's used in updateChart
    /* THIS SECTION IS IF YOU >>>DON'T<<< COUNT THE CURRENT WEEK
        AMONG THE PAST 8 WEEKS
    monday_8_weeks_ago = findThisMondayDate();
    monday_8_weeks_ago.setDate(monday_8_weeks_ago.getDate() - 8*7);
    monday_8_weeks_ago = dateToString(monday_8_weeks_ago);
    last_sunday = findThisMondayDate();
    last_sunday.setDate(last_sunday.getDate() - 1);
    last_sunday = dateToString(last_sunday);
    */

    /* THIS SECTION IS IF YOU >>>DO<<< COUNT THE CURRENT WEEK
        AMONG THE PAST 8 WEEKS
    */
    monday_8_weeks_ago = findThisMondayDate();
    monday_8_weeks_ago.setDate(monday_8_weeks_ago.getDate() - 7*7);
    monday_8_weeks_ago = dateToString(monday_8_weeks_ago);
    last_sunday = findThisSundayDate();
    last_sunday = dateToString(last_sunday);


    for (let i = 8; i > 0; i--){
        let mon_temp = findThisMondayDate();
        let sun_temp = findThisSundayDate();
        mon_temp.setDate(mon_temp.getDate() - 7*(i - 1));
        sun_temp.setDate(sun_temp.getDate() - 7*(i - 1));
        past_8_weeks_periods[9 - i].monday = dateToString(mon_temp);
        past_8_weeks_periods[9 - i].sunday = dateToString(sun_temp);
    }

    selected_year = findThisMondayDate().getFullYear();
    styleChart();

    let curr_time = document.getElementById('curr_time');
    const now = new Date();
    curr_time.innerText = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0') + ":" + now.getSeconds().toString().padStart(2, '0');
    setInterval(updateTime, 1000);

    document.getElementById('yearSelect').addEventListener('change', () => {
        playClickSound();
        selected_year = document.getElementById('yearSelect').value;

        refreshChart();
    });

    document.getElementById('date_picker').addEventListener('mouseenter', () => {
        if (selected_mode){
            // DARK MODE
            document.getElementById('custom_date_label').style.color = 'white';
            document.getElementById('custom_date').style.color = 'white';
        } else {
            document.getElementById('custom_date_label').style.color = 'black';
            document.getElementById('custom_date').style.color = 'black';
        }
        document.getElementById('custom_date').classList.remove('grayIcon');
        document.getElementById('custom_date').classList.add('blackIcon');
    });
    
    document.getElementById('date_picker').addEventListener('mouseleave', () => {
        if (stayBlack) return;
        if (selected_mode){
            // DARK MODE
            document.getElementById('custom_date_label').style.color = '#333333';
            document.getElementById('custom_date').style.color = '#333333';
        } else {
            document.getElementById('custom_date_label').style.color = '#e0e0e0';
            document.getElementById('custom_date').style.color = '#e0e0e0';
        }
        document.getElementById('custom_date').classList.remove('blackIcon');
        document.getElementById('custom_date').classList.add('grayIcon');
    });

    document.getElementById('custom_date').addEventListener('input', (event) => {
        let selectedDate = event.target.value;
        
        let now = new Date();
        let todaysDateString = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    
        if (selectedDate !== todaysDateString && selectedDate != ''){
            stayBlack = true;
        } 
        else {
            stayBlack = false;
        }
    });

    document.getElementById('enter_btn').addEventListener('click', () => {
        // playClickSound();
        // distance, time, date
        let data = [];
        let distance = document.getElementById('distance').value;
        let time_string = document.getElementById('running_time').value;
        let date_string = document.getElementById('custom_date').value;

        let time = 0;

        let now = new Date();
        let date = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;

        // check validity of time input
        let regexPattern = /^(?:(\d{1,2}):)?(\d{1,2}):(\d{1,2})$/;
        let match = time_string.match(regexPattern);
       
        if (match == null){
            playErrorSound();
            let msg_element = document.getElementById('msg');
            msg_element.className = '';
            msg_element.classList.add('redText');
            msg_element.innerText = 'Neko polje je neispravno!';

            setTimeout(function() {
                msg_element.innerText = '';
            }, 1000);

            return;
        }

        if (match[1] !== undefined){
            time += parseInt(match[1])*3600;
        }

        time += parseInt(match[2])*60;
        time += parseInt(match[3]);
    
        if (date_string !== ''){
            date = date_string;
        }
                
        data.push(distance);
        data.push(time);
        data.push(date);
        data.push(last_id);

        window.ipcRenderer.send('newActivity', data);

        tryToEnterNewPR(time_string, distance);

        selected_year = new Date().getFullYear();
        playSuccessSound();
        let msg_element = document.getElementById('msg');
        msg_element.className = '';
        msg_element.classList.add('greenText');
        msg_element.innerText = 'Uneto.';

        setTimeout(function() {
            msg_element.innerText = '';
        }, 1000);
       
        getRecentData().then(data => {
            activityHistoryData = data;

            clearChartData();

            let activityHistoryDataLen = activityHistoryData.length;
            for (let i = 0; i < activityHistoryDataLen; i++){
                let row = activityHistoryData[i];

                let year = row.activity_date.slice(0, 4);
                if (!available_years.includes(year)){
                    available_years.push(year);
                }

                addChartData(row);
            }

            refreshTabs();
        });
        clearInputs();
    });

    option_this_week.addEventListener('click', () => {
        if (option_this_week.classList.contains('unselected')){
            option_this_week.classList = 'selected';
            option_weekly.classList = 'unselected';
            option_monthly.classList = 'unselected';
            combo_box.disabled = true;
            selected_timeframe = 1;
            window.ipcRenderer.send('change-sel-timeframe', selected_timeframe);
            playClickSound();
            refreshChart();
        }
    });

    option_weekly.addEventListener('click', () => {
        if (option_weekly.classList.contains('unselected')){
            option_this_week.classList = 'unselected';
            option_weekly.classList = 'selected';
            option_monthly.classList = 'unselected';
            combo_box.disabled = true;
            selected_timeframe = 2;
            window.ipcRenderer.send('change-sel-timeframe', selected_timeframe);
            playClickSound();
            refreshChart();
        }
    });

    option_monthly.addEventListener('click', () => {
        if (option_monthly.classList.contains('unselected')){
            option_this_week.classList = 'unselected';
            option_weekly.classList = 'unselected';
            option_monthly.classList = 'selected';
            combo_box.disabled = false;
            selected_timeframe = 3;
            window.ipcRenderer.send('change-sel-timeframe', selected_timeframe);
            playClickSound();
            refreshChart();
        }
    });

    option_distance.addEventListener('click', () => {
        if (option_distance.classList.contains('unselected')){
            option_distance.classList = 'selected2';
            option_time.classList = 'unselected';
            selected_distance = true;
            window.ipcRenderer.send('change-sel-distance', selected_distance);
            playClickSound();
            refreshChart();
        }
    });

    option_time.addEventListener('click', () => {
        if (option_time.classList.contains('unselected')){
            option_distance.classList = 'unselected';
            option_time.classList = 'selected2';
            selected_distance = false;
            window.ipcRenderer.send('change-sel-distance', selected_distance);
            playClickSound();
            refreshChart();
        }
    });

    document.getElementById('pr_undo').addEventListener('click', () => {
        playSuccessSound();

        let ret;
        getUndoResponsePR()
            .then(response => {
                ret = response;

                let msg_element = document.getElementById('msg');
                msg_element.className = '';
                msg_element.classList.add('orangeText');
                if (ret === 1){
                    msg_element.innerText = 'Nema podataka za brisanje.';
                } else {
                    msg_element.innerText = 'Izbrisan poslednji PR.';
                }

                setTimeout(function() {
                    msg_element.innerText = '';
                }, 1000);

                refreshTabs();
            })
            .catch(error => {
                console.error('Unexpected error. renderer.js -> window.onload');
            });

        closeDialog();
    });

    document.getElementById('act_undo').addEventListener('click', () => {
        playSuccessSound();

        let ret;
        getUndoResponse()
            .then(response => {
                ret = response;
            })
            .catch(error => {
                console.error('Unexpected error. renderer.js -> window.onload');
            });

        getRecentData().then(data => {
            let msg_element = document.getElementById('msg');
            msg_element.className = '';
            msg_element.classList.add('orangeText');
            if (ret === 1){
                msg_element.innerText = 'Nema podataka za brisanje.';
            } else {
                msg_element.innerText = 'Izbrisan poslednji unos.';
            }

            setTimeout(function() {
                msg_element.innerText = '';
            }, 1000);

            activityHistoryData = data;
            clearChartData();

            let iter_len = activityHistoryData.length;
            for (let i = 0; i < iter_len; i++){
                addChartData(activityHistoryData[i]);
            }
            

            refreshTabs();
        });

        closeDialog();
    });

    document.getElementsByClassName('close')[0].addEventListener('click', () => {
        playClickSound();
        document.getElementById('myModal').style.display = "none";
    });

    document.getElementById('undo_btn').addEventListener('click', () => {
        playClickSound();

        let dialog = document.getElementById('myModal');
        document.getElementById('dialog_msg').innerText = 'Sigurno? Klikni šta želiš da izbrišeš, ili otkaži tako što klikneš na \'x\' ili van dijaloga.';
        document.getElementById('act_undo').style.display = 'inline-block';
        document.getElementById('pr_undo').style.display = 'inline-block';
        document.getElementById('input_pr_btn').style.display = 'none';
        document.getElementById('data_table').style.display = 'none';
        dialog.style.display = 'block';

    });

    document.getElementById('input_pr_btn').addEventListener('click', () => {
        let time = 0;
        let regexPattern = /^(?:(\d{1,2}):)?(\d{1,2}):(\d{1,2})$/;
        let match = time_string.match(regexPattern);
       
        if (match == null){
            playErrorSound();
            let msg_element = document.getElementById('msg');
            msg_element.className = '';
            msg_element.classList.add('redText');
            msg_element.innerText = 'Neispravan unos!';

            setTimeout(function() {
                msg_element.innerText = '';
            }, 1000);

            closeDialog();

            document.getElementById(text_box_id).value = '';

            return;
        }

        let prev_time = 0;
        let match_prev_time = placeholder_vals[text_box_id].match(regexPattern);


        if (match[1] !== undefined){
            time += parseInt(match[1])*3600;
        }

        time += parseInt(match[2])*60;
        time += parseInt(match[3]);

        if (placeholder_vals[text_box_id] == 'n/a'){
            prev_time = 31536000;
        } else {
            if (match_prev_time[1] !== undefined){
                prev_time += parseInt(match_prev_time[1])*3600;
            }
    
            prev_time += parseInt(match_prev_time[2])*60;
            prev_time += parseInt(match_prev_time[3]);
        }
        
        if (prev_time <= time){
            playErrorSound();
            let msg_element = document.getElementById('msg');
            msg_element.className = '';
            msg_element.classList.add('redText');
            msg_element.innerText = 'Novi PR gori od prošlog?';

            setTimeout(function() {
                msg_element.innerText = '';
            }, 2000);

            closeDialog();

            document.getElementById(text_box_id).value = '';

            return;
        }


        playSuccessSound();
        let msg_element = document.getElementById('msg');
        msg_element.className = '';
        msg_element.classList.add('greenText');
        msg_element.innerText = 'Uneto.';

        setTimeout(function() {
            msg_element.innerText = '';
        }, 1000);

        window.ipcRenderer.send('newPR', [pr_description, time]);

        refreshRightTab();
        closeDialog();
    });

    document.getElementById('distance').addEventListener('click', () => {
        document.getElementById('distance').select();
    });

    thisMonday = findThisMonday();
    thisSunday = findThisSunday();

    JSON_info = await getJSONinfo();
    initChartOptions();

    if (selected_mode){
        // dark mode!
        display_mode.setAttribute('href', './dark_styles.css');
    } else {
        display_mode.setAttribute('href', './styles.css');
    }

    activityHistoryData = await getRecentData();
    pr_data = await getPRdata();

    let iter_len = activityHistoryData.length;
    for (let i = 0; i < iter_len; i++){
        let row = activityHistoryData[i];

        let year = row.activity_date.slice(0, 4);
        if (!available_years.includes(year)){
            available_years.push(year);
        }

        addChartData(row);
    }

    refreshTabs();

    fadeOutEffect();
}

function tryToEnterNewPR(time_string, distance){
    let time = 0;
    let regexPattern = /^(?:(\d{1,2}):)?(\d{1,2}):(\d{1,2})$/;
    let match = time_string.match(regexPattern);

    let tolerance = 4/100; // in percent
    let upper_bound = distance * (1 + tolerance);
    let lower_bound = distance * (1 - tolerance);

    let pr_description;
    let target_distance;
    let target_index = -1;
    for (let i = 0; i < pr_data.length; i++){
        let temp = pr_data[i].cat_data.pr_cat_distance;
        if (temp >= lower_bound && temp <= upper_bound){
            target_index = i + 1;
            target_distance = pr_data[i].cat_data.pr_cat_distance;
            pr_description = pr_data[i].cat_data.pr_cat_desc;
            break;
        }
    }

    if (target_index == -1){
        return;
    }

    
    let ind = `t${target_index}`;
    let prev_time = 0;
    let match_prev_time = placeholder_vals[ind].match(regexPattern);

    if (match[1] !== undefined){
        time += parseInt(match[1])*3600;
    }

    time += parseInt(match[2])*60;
    time += parseInt(match[3]);

    if (placeholder_vals[ind] == 'n/a'){
        prev_time = 31536000;
    } else {
        if (match_prev_time[1] !== undefined){
            prev_time += parseInt(match_prev_time[1])*3600;
        }

        prev_time += parseInt(match_prev_time[2])*60;
        prev_time += parseInt(match_prev_time[3]);
    }

    // the time needs to be scaled, because there's a tolerance involved;
    // so the distance may not be exact
    time = Math.round((target_distance/distance)*time);
    
    if (prev_time <= time){
        return;
    }

    window.ipcRenderer.send('newPR', [pr_description, time]);

    refreshRightTab();
}

function fadeOutEffect(){
    let fadeTarget = document.getElementById('overlay');
    let fadeEffect = setInterval(function () {
        if (!fadeTarget.style.opacity) {
            fadeTarget.style.opacity = 1;
        }
        if (fadeTarget.style.opacity > 0) {
            fadeTarget.style.opacity -= 0.5;
        } else {
            fadeTarget.style.zIndex = -1;
            clearInterval(fadeEffect);
        }
    }, 15);
}

function closeDialog(){
    let dialog = document.getElementById('myModal');
    dialog.style.display = 'none';
}

function initChartOptions(){
    selected_timeframe = JSON_info[0];
    selected_distance = JSON_info[1];
    selected_mode = JSON_info[2];

    switch (selected_timeframe){
        case 1:
            option_this_week.classList = 'selected';
            option_weekly.classList = 'unselected';
            option_monthly.classList = 'unselected';
            combo_box.disabled = true;
            break;
        case 2:
            option_this_week.classList = 'unselected';
            option_weekly.classList = 'selected';
            option_monthly.classList = 'unselected';
            combo_box.disabled = true;
            break;
        case 3:
            option_this_week.classList = 'unselected';
            option_weekly.classList = 'unselected';
            option_monthly.classList = 'selected';
            combo_box.disabled = false;
            break;
        default:
            console.error('Unexpected error! renderer.js > initChartOptions() > switch1');
    }
    switch (selected_distance){
        case true:
            option_distance.classList = 'selected2';
            option_time.classList = 'unselected';
            selected_distance = true;
            break;
        case false:
            option_distance.classList = 'unselected';
            option_time.classList = 'selected2';
            selected_distance = false;
            break;
        default:
            console.error('Unexpected error! renderer.js > initChartOptions > switch2');
    }
}

function clearInputs(){
    document.getElementById('distance').value = '';
    document.getElementById('running_time').value = '';
    document.getElementById('custom_date').value = '';
    stayBlack = false;
    
    if (selected_mode){
        // DARK MODE
        document.getElementById('custom_date_label').style.color = '#333333';
        document.getElementById('custom_date').style.color = '#333333';
    } else {
        document.getElementById('custom_date_label').style.color = '#e0e0e0';
        document.getElementById('custom_date').style.color = '#e0e0e0';
    }

    document.getElementById('custom_date').classList.remove('blackIcon');
    document.getElementById('custom_date').classList.add('grayIcon');
}

function refreshTabs(){
    populateComboBox();
    refreshLeftTab();
    refreshRightTab();
    refreshChart();
    updateStats();
    thisMonday = findThisMonday();
    thisSunday = findThisSunday();
}

function playClickSound(){
    click_sound.play();
}

function playErrorSound(){
    error_sound.play();
}

function playSuccessSound(){
    success_sound.play();
}

function populateComboBox(){
    let yearSelect = document.getElementById('yearSelect');
    yearSelect.innerHTML = '';

    let available_years_len = available_years.length;
    for (let i = 0; i < available_years_len; i++){
        let year = available_years[i];

        let temp = document.createElement('option');
        temp.textContent = year.toString();
        temp.value = parseInt(year);
        yearSelect.appendChild(temp);
    }


    yearSelect.selectedIndex = 0;
}

function findThisMondayDate(){
    let now = new Date();

    // 0 is Sunday, 1 is Monday
    while (now.getDay() !== 1){
        now.setDate(now.getDate() - 1);
    }

    return now;
}

function findThisSundayDate(){
    let now = new Date();

    // 0 is Sunday, 1 is Monday
    while (now.getDay() !== 0){
        now.setDate(now.getDate() + 1);
    }

    return now;
}

function findThisMonday(){
    let now = new Date();

    // 0 is Sunday, 1 is Monday
    while (now.getDay() !== 1){
        now.setDate(now.getDate() - 1);
    }

    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
}

function findThisSunday(){
    let now = new Date();

    // 0 is Sunday, 1 is Monday
    while (now.getDay() !== 0){
        now.setDate(now.getDate() + 1);
    }

    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
}

function updateStats(){
    let total_ran = 0;
    let total_seconds = 0;
    let fastest_pace_ever = null;
    let ran_this_week = 0;
    let fastest_pace_this_week = null;

    let thisMonday = findThisMonday();
    let thisSunday = findThisSunday();

    let iter_len = activityHistoryData.length;
    for (let i = 0; i < iter_len; i++){
        let row = activityHistoryData[i];

        if (fastest_pace_ever === null){
            fastest_pace_ever = row.pace;
        } else {
            if (row.pace < fastest_pace_ever){
                fastest_pace_ever = row.pace;
            }
        }
        total_ran += row.distance;
        total_seconds += row.activity_time;

        if (row.activity_date >= thisMonday && row.activity_date <= thisSunday){
            if (fastest_pace_this_week === null){
                fastest_pace_this_week = row.pace;
            } else {
                if (row.pace < fastest_pace_this_week){
                    fastest_pace_this_week = row.pace;
                }
            }
            ran_this_week += row.distance;
        }
    }
   

    if (fastest_pace_ever !== null){
        if (fastest_pace_ever[0] === '0')
            fastest_pace_ever = fastest_pace_ever.slice(1);
    } else {
        fastest_pace_ever = 'n/a';
    }
    if (fastest_pace_this_week !== null){
        if (fastest_pace_this_week[0] === '0')
            fastest_pace_this_week = fastest_pace_this_week.slice(1);
    } else {
        fastest_pace_this_week = 'n/a';
    }
    
    document.getElementById('total_ran').innerText = (Math.round(total_ran * 10) / 10).toString() + ' K';
    document.getElementById('total_time').innerText = `${Math.round(total_seconds/3600)}h ${Math.round((total_seconds/3600)%60)}min`;
    document.getElementById('fastest_pace_ever').innerText = fastest_pace_ever;
    document.getElementById('ran_this_week').innerText = (Math.round(ran_this_week * 10) / 10).toString() + ' K';
    document.getElementById('fastest_pace_this_week').innerText = fastest_pace_this_week;
}

let days_of_week = ['ponedeljak', 'utorak', 'sreda', 'četvrtak', 'petak', 'subota', 'nedelja'];
let months = ['januar', 'februar', 'mart', 'april', 'maj', 'jun', 'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar'];


function insert_chronologically(array, sibling, date){
    let i = 0;
    for (i = 0; i < array.length; i++){
        if (array[i] > date){
            break;
        }
    }

    array.splice(i, 0, date);
    sibling.splice(i, 0, 0);
    return i;
}

function addChartData(row){
    // most recent date will be passed as an argument first
    // least recent date will be last

    // this week
    if (row.activity_date >= thisMonday && row.activity_date <= thisSunday){
        if (!chart_data.distance_data.this_week.x.includes(row.activity_date)){
            let index;
            index = insert_chronologically(chart_data.distance_data.this_week.x, chart_data.distance_data.this_week.y, row.activity_date);
            insert_chronologically(chart_data.time_data.this_week.x, chart_data.time_data.this_week.y, row.activity_date);
            
            chart_data.distance_data.this_week.y[index] = row.distance;
            chart_data.time_data.this_week.y[index] = Math.round(10*row.activity_time/3600)/10; // hours, 1 decimal

        } else {
            let index = chart_data.distance_data.this_week.x.indexOf(row.activity_date);

            chart_data.distance_data.this_week.y[index] += row.distance;
            chart_data.time_data.this_week.y[index] += Math.round(10*row.activity_time/3600)/10; // hours, 1 decimal
        }
    }

    // past 8 weeks
    if (row.activity_date >= monday_8_weeks_ago && row.activity_date <= last_sunday){
        for (let i = 1; i <= 8; i++){
            if (row.activity_date >= past_8_weeks_periods[i].monday && row.activity_date <= past_8_weeks_periods[i].sunday){
                chart_data.distance_data.weekly.y[i - 1] += row.distance; 
                chart_data.time_data.weekly.y[i - 1] += Math.round(10*row.activity_time/3600)/10; // hours, 1 decimal
                break;
            }
        }
    }


    // past 12 months
    let activity_year = parseInt(row.activity_date.slice(0, 4));
    let activity_month = parseInt(row.activity_date.slice(5, 7));

    if (!(activity_year in chart_data.distance_data.monthly.y)){
        chart_data.distance_data.monthly.y[activity_year] = [];
        chart_data.time_data.monthly.y[activity_year] = [];

        if (activity_year != new Date().getFullYear()){
            for (let i = 0; i < 12; i++){
                chart_data.distance_data.monthly.y[activity_year].push(0);
                chart_data.time_data.monthly.y[activity_year].push(0);
            }
        } else {
            for (let i = 0; i < findThisMondayDate().getMonth() + 1; i++){
                chart_data.distance_data.monthly.y[activity_year].push(0);
                chart_data.time_data.monthly.y[activity_year].push(0);
            }
        }

    }
    
    chart_data.distance_data.monthly.y[activity_year][activity_month - 1] += row.distance;
    chart_data.time_data.monthly.y[activity_year][activity_month - 1] += Math.round(10*row.activity_time/3600)/10; // hours, 1 decimal
}

function clearChartData(){
    chart_data = {
        "distance_data": {
            "this_week": {
                "x": [],
                "y": []
            },
            "weekly": {
                "x": [],
                "y": [0, 0, 0, 0, 0, 0, 0, 0]
            },
            "monthly": {
                "x": [],
                "y": {}
            }
        },
        "time_data": {
            "this_week": {
                "x": [],
                "y": []
            },
            "weekly": {
                "x": [],
                "y": [0, 0, 0, 0, 0, 0, 0, 0]
            },
            "monthly": {
                "x": [],
                "y": {}
            }
        }
    };
}

function dateToString(date){
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

function styleChart(){
    // destroy instance of chart if it exists, and then create a new one
    if (running_chart){
        running_chart.destroy();
    }

    // selected_mode == true -> DARK MODE
    const bckg_color = selected_mode ? 'rgb(40, 40, 40)' : 'white'; 
    const dataset_text = selected_distance ? 'Razdaljina [km]' : 'Vreme [h]';
    const gridline_color = selected_mode ? '#353535' : '#eeeeee';
    const tick_color = selected_mode ? '#c0c0c0' : 'black';
    const title_color = selected_mode ? 'white' : 'black';

    const plugin = {
        id: 'customCanvasBackgroundColor',
        beforeDraw: (chart, args, options) => {
          const {ctx} = chart;
          ctx.save();
          ctx.globalCompositeOperation = 'destination-over';
          ctx.fillStyle = options.color || bckg_color;
          ctx.fillRect(0, 0, chart.width, chart.height);
          ctx.restore();
        }
      };

    running_chart = new Chart("myChart", {
        type: "bar",
        data: {
            labels: xVals,
            datasets: [{
                label: dataset_text,
                data: yVals
            }]
        },
        options: {
            plugins: {
                legend: {
                    labels: {
                        font: {
                            family: 'Courier New'
                        },
                        color: title_color
                    }
                }
            },
            maintainAspectRatio: false,
            scales: {
                y: {
                    grid: {
                        color: gridline_color
                    },
                    ticks: {
                        color: tick_color,
                        font: {
                            family: 'Courier New'
                        }
                    }
                },
                x: {
                    grid: {
                        color: gridline_color
                    },
                    ticks: {
                        color: tick_color,
                        font: {
                            family: 'Courier New'
                        }
                    }
                }
            }
        },
        plugins: [plugin]
    });
}

function refreshChart(){
    styleChart();

    // Show days of week instead of dates if 'This week' option is selected
    let now = new Date();
    
    // 0 is Sunday, 1 is Monday, 6 is Saturday
    let curr_day = now.getDay();
    // switch it to my system, where 1 is Monday, 7 is Sunday
    curr_day = (curr_day + 6) % 7 + 1;


    let date_iterator = new Date();

    // 0 is Sunday, 1 is Monday
    while (date_iterator.getDay() !== 1){
        date_iterator.setDate(date_iterator.getDate() - 1);
    }

    let y_vals_aux = {};
    let x_markings = [];
    for (let i = 0; i < curr_day; i++){
        y_vals_aux[dateToString(date_iterator)] = 0;
        date_iterator.setDate(date_iterator.getDate() + 1);
        x_markings.push(days_of_week[i]);
    }

    let month_markings = [];
    // getMonth(): january -> 0, february -> 1, ..., december -> 11
    let upper_bound;
    if (document.getElementById('yearSelect').selectedIndex == 0){
        upper_bound = now.getMonth() + 1;
    } else {
        upper_bound = 12;
    }

    for (let i = 0; i < upper_bound; i++){
        month_markings.push(months[i]);
    }


    if (selected_mode){
        // DARK MODE
        running_chart.data.datasets[0].backgroundColor = 'rgb(139, 46, 139)';
    } else {
        running_chart.data.datasets[0].backgroundColor = 'orangered';
    }


    if (selected_distance){

        if (selected_timeframe === 1){
            let i;
            for (i = 0; i < chart_data.distance_data.this_week.y.length; i++){
                y_vals_aux[chart_data.distance_data.this_week.x[i]] += chart_data.distance_data.this_week.y[i];
            }
            yVals = [];
            for (let key in y_vals_aux){
                yVals.push(y_vals_aux[key]);
            }

            xVals = x_markings;
        }
        else if (selected_timeframe === 2){
            x_markings = [];
            for (let i = -7; i <= 0; i++){
                x_markings.push(i.toString() + '. ned.');
            }

            xVals = x_markings;
            yVals = chart_data.distance_data.weekly.y;
        }
        else if (selected_timeframe === 3){
            xVals = month_markings;
            yVals = chart_data.distance_data.monthly.y[selected_year];
        }
    } else {
        if (selected_timeframe === 1){
            let i;
            for (i = 0; i < chart_data.time_data.this_week.y.length; i++){
                y_vals_aux[chart_data.time_data.this_week.x[i]] += chart_data.time_data.this_week.y[i];
            }
            yVals = [];
            for (let key in y_vals_aux){
                yVals.push(y_vals_aux[key]);
            }

            xVals = x_markings;
        }
        else if (selected_timeframe === 2){
            x_markings = [];
            for (let i = -7; i <= 0; i++){
                x_markings.push(i.toString() + ' ned.');
            }

            xVals = x_markings;
            yVals = chart_data.time_data.weekly.y;
        }
        else if (selected_timeframe === 3){
            xVals = month_markings;
            yVals = chart_data.time_data.monthly.y[selected_year];
        }
    }

    running_chart.data.labels = xVals;
    running_chart.data.datasets[0].data = yVals;

    running_chart.update();
}

async function input_new_pr(){

    let dialog = document.getElementById('myModal');
    document.getElementById('dialog_msg').innerText = 'Uneti novi PR?';
    document.getElementById('act_undo').style.display = 'none';
    document.getElementById('pr_undo').style.display = 'none';
    document.getElementById('input_pr_btn').style.display = 'inline-block';
    document.getElementById('data_table').style.display = 'none';
    dialog.style.display = 'block';

}

let html_table;
let pr_input_cnt;

async function findPRDate(arg){
    return window.ipcRenderer.getPRDate(arg);
}

async function addRowRightPanel(columns, dialog_data){
    const table_row = document.createElement('tr');
    let dialog_date = await findPRDate(dialog_data.pr_id);
    if (dialog_date.length != 0){
        dialog_date = dialog_date[0].pr_date;
    }

    table_row.id = 'pr_row';
    for (let i = 0; i < 3; i++){
        let cell = document.createElement('td');;
        if (i != 1){
            cell.textContent = columns[i];
            cell.addEventListener('click', () => {
                playClickSound();
                let dialog = document.getElementById('myModal');
                if (dialog_data.pr_id == -1){
                    document.getElementById('dialog_msg').innerText = '';
                } else {
                    document.getElementById('dialog_msg').innerText = formatToText(dialog_date);
                }
                document.getElementById('act_undo').style.display = 'none';
                document.getElementById('pr_undo').style.display = 'none';
                document.getElementById('input_pr_btn').style.display = 'none';
                document.getElementById('data_table').style.display = 'table';

                document.getElementById('data_table_dist').innerText = (Math.round(dialog_data.cat_data.pr_cat_distance * 10)/10).toString() + ' K';
                document.getElementById('data_table_pace').innerText = dialog_data.pace[0] === '0' ? dialog_data.pace.slice(1) : dialog_data.pace;
                document.getElementById('data_table_time').innerText = dialog_data.time;

                dialog.style.display = 'block';
            });
        } else {
            // pr_time needs to be a textBox

            let txtBox = document.createElement('input');
            txtBox.type = 'text';
            txtBox.placeholder = columns[i];
            placeholder_vals[`t${pr_input_cnt}`] = columns[i];
            txtBox.classList = `txtBoxIn`;
            txtBox.id = `t${pr_input_cnt}`;
            txtBox.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    pr_description = columns[0]; 
                    time_string = txtBox.value;
                    text_box_id = txtBox.id;

                    input_new_pr();
                }
            });
            pr_input_cnt++;
            cell.appendChild(txtBox);
        }
        
        cell.classList = `pr_cell${i + 1}`;
        table_row.appendChild(cell);
    }
    html_table.appendChild(table_row);
}

async function refreshRightTab(){
    pr_data = await getPRdata();

    pr_input_cnt = 1;
    let rightPanel = document.getElementById('right');
    rightPanel.innerHTML = '<p style="margin-top: 0">PR-ovi:</p>';
    
    html_table = document.createElement('table');
    html_table.id = 'pr_table';

    let iter_len = pr_data.length;
    for (let i = 0; i < iter_len; i++){
        let row = pr_data[i];
        await addRowRightPanel([row.cat_data.pr_cat_desc, row.time, row.pace], pr_data[i]);
    }

    rightPanel.appendChild(html_table);

}

let left_table;

function formatToText(stringified){
    let year = stringified.slice(0, 4);
    let month = parseInt(stringified.slice(5, 7));
    let day = stringified.slice(8, 10);

    switch (month){
        case 1:
            month = 'januar';
            break;
        case 2:
            month = 'februar';
            break;
        case 3:
            month = 'mart';
            break;
        case 4:
            month = 'april';
            break;
        case 5:
            month = 'maj';
            break;
        case 6:
            month = 'jun';
            break;
        case 7:
            month = 'jul';
            break;
        case 8:
            month = 'avgust';
            break;
        case 9:
            month = 'septembar';
            break;
        case 10:
            month = 'oktobar';
            break;
        case 11:
            month = 'novembar';
            break;
        case 12:
            month = 'decembar';
            break;
        default:
            month = 'err';
    }
    return day + '. ' + month + ' ' + year + '.';
}

function addRowLeftPanel(columns, activity_row){
    const table_row = document.createElement('tr');
    for (let i = 0; i < 4; i++){
        const cell = document.createElement('td');
        cell.textContent = columns[i];
        cell.classList = `left_cell${i + 1}`;
        table_row.appendChild(cell);
    }
    table_row.addEventListener('click', () => {
        playClickSound();

        let formatted_time = '';
        if (activity_row.activity_time < 3600){
            formatted_time = `${Math.floor(activity_row.activity_time/60).toString().padStart(1, '0')}:${(activity_row.activity_time%60).toString().padStart(2, '0')}`;
        } else {
            formatted_time = `${Math.floor(activity_row.activity_time/3600).toString().padStart(1, '0')}:${Math.floor((activity_row.activity_time%3600)/60).toString().padStart(2, '0')}:${(activity_row.activity_time%60).toString().padStart(2, '0')}`;
        }

        let dialog = document.getElementById('myModal');
        document.getElementById('dialog_msg').innerText = formatToText(activity_row.activity_date);
        document.getElementById('act_undo').style.display = 'none';
        document.getElementById('pr_undo').style.display = 'none';
        document.getElementById('input_pr_btn').style.display = 'none';
        document.getElementById('data_table').style.display = 'table';

        document.getElementById('data_table_dist').innerText = (Math.round(activity_row.distance * 10)/10).toString() + ' K';
        document.getElementById('data_table_pace').innerText = activity_row.pace[0] === '0' ? activity_row.pace.slice(1) : activity_row.pace;
        document.getElementById('data_table_time').innerText = formatted_time;

        dialog.style.display = 'block';
    });
    left_table.appendChild(table_row);
}

function refreshLeftTab(){
    let leftPanel = document.getElementById('left');
    leftPanel.innerHTML = '<p style="margin-top: 0">Istorija aktivnosti:</p>';

    left_table = document.createElement('table');
    left_table.id = 'left_table';

    let counter = 1;
    let iter_len = activityHistoryData.length;
    for (let i = 0; i < iter_len; i++){
        let row = activityHistoryData[i];

        let formattedDate = row.activity_date;

        let now = new Date();
        let yesterday = new Date(now);
        let twoDaysAgo = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        twoDaysAgo.setDate(now.getDate() - 2);

        let todaysDateString = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
        let yesterdaysDateString = `${yesterday.getFullYear()}-${(yesterday.getMonth() + 1).toString().padStart(2, '0')}-${yesterday.getDate().toString().padStart(2, '0')}`;
        let twoDaysAgoString = `${twoDaysAgo.getFullYear()}-${(twoDaysAgo.getMonth() + 1).toString().padStart(2, '0')}-${twoDaysAgo.getDate().toString().padStart(2, '0')}`;


        if (formattedDate === todaysDateString){
            formattedDate = 'danas';
        }
        else if (formattedDate === yesterdaysDateString){
            formattedDate = 'juče';
        }
        else if (formattedDate === twoDaysAgoString){
            formattedDate = 'prekjuče';
        }

        let formattedPace = row.pace;
        if (formattedPace[0] === '0'){
            formattedPace = formattedPace.slice(1);
        }

        addRowLeftPanel([counter.toString(16) + '.', (Math.round(row.distance * 10) / 10).toFixed(1) + ' K', formattedPace, formattedDate], activityHistoryData[i]);

        counter++;
    }

    leftPanel.appendChild(left_table);
    last_id = counter;
}

function updateTime(){
    const now = new Date();
    curr_time.innerText = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0') + ":" + now.getSeconds().toString().padStart(2, '0');
}

async function getRecentData(){
    return window.ipcRenderer.getRecentActivities();
}

async function getJSONinfo(){
    return window.ipcRenderer.getJSONinfo();
}

async function getUndoResponse(){
    return window.ipcRenderer.getUndoResponse();
}

async function getPRdata(){
    return window.ipcRenderer.getPRdata();
}

async function getUndoResponsePR(){
    return window.ipcRenderer.getUndoResponsePR();
}