window.onload = async function() {
    JSON_info = await getJSONinfo();
    let selected_mode = JSON_info[2];
    let display_mode = document.getElementById('display_mode');

    if (selected_mode){
        // dark mode!
        display_mode.setAttribute('href', './dark_styles.css');
    } else {
        display_mode.setAttribute('href', './styles.css');
    }
}

async function getJSONinfo(){
    return window.ipcRenderer.getJSONinfo();
}