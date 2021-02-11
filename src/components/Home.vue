<template>
  <div class="hello">
      <div id="div">
        Home Component - Message from Navigator.vue: <!-- {{msg}} -->
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
  let i = 0;
  let id;
  let lastKeyIndex;
  let key;
  let index;
  let arrayLength;
  let newArrayLength;

  export default {
    name: 'Home',

    data() {
      return {
        // globalFileHandle: 'fileHandle' // This makes the varibale of fileHandle global
      }
    },

    methods: {
      async openFile() { //Source: https://web.dev/file-system-access/
        let textArea = document.getElementById('editor');
        [fileHandle] = await window.showOpenFilePicker();
        const file = await fileHandle.getFile();
        const contents = await file.text();
        textArea.value = contents;
      },

      async saveFile() { //Source: https://web.dev/file-system-access/
        let textArea = document.getElementById('editor');
        let writable = await fileHandle.createWritable();
        await writable.write(textArea.value);
        await writable.close();
      },

      async openFolder() { //Source: https://www.youtube.com/watch?v=csCk4mrEmm8
        folder = await window.showDirectoryPicker();
        await this.getFiles(folder);
        console.log(treeData)
      },

      async getFiles(folder, parent = null, parentIndex = 0, array = []) {
        for await (const entry of folder.values()) {
          i++
          id = i-1

          if (entry.kind === "file") {
            if (parent == null) {
              treeData.push ({ //Array/Object structure: https://zdy1988.github.io/vue-jstree/
                id: id,
                text: entry.name,
                value: "",
                icon: "",
                opened: "true",
                selected: "false",
                disabled: "false",
                loading: "false",
                parent: parent ?? '#',
                children: []
              })
            }
            else {
              await this.assign(treeData, array, {
                id: id,
                text: entry.name,
                value: "",
                icon: "",
                opened: "true",
                selected: "false",
                disabled: "false",
                loading: "false",
                parent: parent ?? '#',
                children: []
              })
            }
          }
          else if (entry.kind === "directory") {
            if (parent == null) {
              treeData.push ({
                id: id,
                text: entry.name,
                value: "",
                icon: "",
                opened: "true",
                selected: "false",
                disabled: "false",
                loading: "false",
                parent: parent ?? '#',
                children: []
              })
            }
            else {
              await this.assign(treeData, array, {
                id: id,
                text: entry.name,
                value: "",
                icon: "",
                opened: "true",
                selected: "false",
                disabled: "false",
                loading: "false",
                parent: parent ?? '#',
                children: []
              })
            }
            //Going deeper in the folder structure by opening another directory by accessing this function again (nested)
            //Therefore updating the array to pass the current tree path to the assign function later
            index = treeData.findIndex(x => x.id === parentIndex) //Source: https://stackoverflow.com/questions/15997879/get-the-index-of-the-object-inside-an-array-matching-a-condition
            
            // await this.getIndex(treeData, array)

            array.push(parentIndex);
            array.push('children');
            
            await this.getFiles(entry, id, index, array)
          }
        }
        //When reaching this part of the function the deeper laying folder structures have been finished processing
        //Therefore updating the array to move up one folder in the path
        arrayLength = array.length
        if (arrayLength >> 0) {
          newArrayLength = arrayLength - 2
        }
        array.length = newArrayLength
      },

      async assign(obj, keyPath, value) { //Source: https://stackoverflow.com/questions/5484673/javascript-how-to-dynamically-create-nested-objects-using-object-names-given-by
        lastKeyIndex = keyPath.length-1;
        for (var i = 0; i < lastKeyIndex; ++ i) {
          key = keyPath[i];
          if (!(key in obj)){
            obj[key] = {}
          }
          obj = obj[key];
        }
        obj[keyPath[lastKeyIndex]].push(value);
      },

      async getIndex(obj, keyPath) {
        lastKeyIndex = keyPath.length-1;
        for (var i = 0; i < lastKeyIndex; ++ i) {
          key = keyPath[i];
          if (!(key in obj)){
            obj[key] = {}
          }
          obj = obj[key];
        }
        index = obj[keyPath[lastKeyIndex]].findIndex(x => x.id === 2)
        console.log(obj[keyPath[lastKeyIndex]])
        console.log(index)
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