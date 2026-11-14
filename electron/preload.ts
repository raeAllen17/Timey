import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  notify: (title: string, body: string) => {
    ipcRenderer.send('timey:notify', { title, body });
  },
});
