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
  // let files = [];
  let entry;
  let treeData = [];
  // let nestedTree = [];
  // treeDOM = $('#folder');

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
        // console.log(files)
        // for await (entry of folder.values()) {
        //   console.log(entry)
        // }
        // console.log(files);
        console.log(treeData)
      },
      // async getFiles(folder, parent = null) {
      async getFiles(folder) {
        for await (entry of folder.values()) {
          // console.log(entry.name)
          if (entry.kind == "file") {
            // treeData.push({
            //   id: entry.name,
            //   parent: parent ?? '#',
            //   text: entry.name
            // })
            // // files.push(entry)
            // // console.log(entry.name)
            treeData.push(entry)
          }
          else {
            // // console.log(entry.name)
            // nestedTree.push(this.getFiles(entry, entry.name));
            // treeData.push({
            //   id: entry.name,
            //   parent: parent ?? '#',
            //   text: entry.name,
            //   children: nestedTree
            // })
            // // files.push(this.getFiles(entry, entry.name))
            treeData.push(entry)
            treeData.push(this.getFiles(entry));
          }
          // treeData.push({
          //   id: entry.name,
          //   parent: parent ?? '#',
          //   text: entry.name
          // })
        }
        // return [...(await Promise.all(files)).flat()]
        // return files
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