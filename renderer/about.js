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

    fadeOutEffect();
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

async function getJSONinfo(){
    return window.ipcRenderer.getJSONinfo();
}