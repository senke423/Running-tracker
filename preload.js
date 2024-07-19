const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ipcRenderer', {
    send: (channel, data) => ipcRenderer.send(channel, data),
    on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
    getRecentActivities: () => ipcRenderer.invoke('get_recent_activities')
});