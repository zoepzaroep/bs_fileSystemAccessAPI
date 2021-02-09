<template>
  <div class="hello">
      <div id="div">
        Home Component - Message from Navigator.vue: {{msg}}
      </div>
      <button v-on:click="openFile()">Open</button>
      <button v-on:click="saveFile()">Save</button>
      <button v-on:click="$emit('open-File')">Emit</button>
      <button v-on:click="openFolder()">Open Folder</button>
      <textarea id="editor" cols="30" rows="10" placeholder="Textarea"></textarea>
      <div id="folder"></div>
  </div>
</template>

<script>
  let fileHandle; //Declaring a varibale here makes it available for all methods below
  let folder;
  let treeData = [];

  export default {
    name: 'Home',

    data() {
      return {
        // globalFileHandle: 'fileHandle' // This makes the varibale of fileHandle global
      }
    },

    methods: {
      async openFile() {
        let textArea = document.getElementById('editor');
        [fileHandle] = await window.showOpenFilePicker();
        const file = await fileHandle.getFile();
        const contents = await file.text();
        textArea.value = contents;
      },

      async saveFile() {
        let textArea = document.getElementById('editor');
        let writable = await fileHandle.createWritable();
        await writable.write(textArea.value);
        await writable.close();
      },

      async openFolder() {
        folder = await window.showDirectoryPicker();
        await this.getFiles(folder);
        console.log(treeData)
      },

      async getFiles(folder) {
        for await (const entry of folder.values()) {
          if (entry.kind === "directory") {
            treeData.push(entry.name)
            await this.getFiles(entry)
          }
          else if (entry.kind === "file") {
            treeData.push(entry.name)
          }
        }
      },

      keyDown: function () {
        const activeElement = document.getElementsByClassName('active')[0]
        if (activeElement && !isNaN(event.key) && event.key > 0) {
          activeElement.innerHTML = event.key
        }
      }
    },

    created: function () {
      // window.addEventListener('keydown', this.keyDown)
      window.addEventListener('keydown', e => {
        if (e.key === 's' && e.metaKey){
          e.preventDefault();
          this.saveFile()
        }
      })
    },

    destroyed: function () {
      // window.removeEventListener('keydown', this.keyDown)
    }
  }
</script>