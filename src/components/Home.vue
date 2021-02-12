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
  //Declaring a varibale here makes it available for all methods below
  let fileHandle;
  let folder;
  let treeData = [];
  let i = 0;
  let id;
  let lastKeyIndex;
  let key;
  let parentIndex; //The index of the array of the parent object
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
        treeData = [];
        folder = await window.showDirectoryPicker();
        await this.getFiles(folder);
        console.log(treeData)
      },

      async getFiles(folder, parentId = null, path = []) {
        for await (const entry of folder.values()) {
          
          //i has to be incrimented at the beginning because this for function is nested and multiple times called within itself befor finishing
          i++
          id = i-1

          if (entry.kind === "file") {
            if (parentId == null) { //parent == null is the initial state when the function is first run
              treeData.push ({ //Array/Object structure: https://zdy1988.github.io/vue-jstree/
                id: id,
                text: entry.name,
                value: "",
                icon: "",
                opened: "true",
                selected: "false",
                disabled: "false",
                loading: "false",
                parent: parentId ?? '#',
                children: []
              })
            }
            else {
              await this.assign(treeData, path, {
                id: id,
                text: entry.name,
                value: "",
                icon: "",
                opened: "true",
                selected: "false",
                disabled: "false",
                loading: "false",
                parent: parentId ?? '#',
                children: []
              })
            }
            // console.log('file_id: ' + id)
            // console.log('file_path: ' + path)
            // console.log('parentId: ' + parentId)
            // console.log('_____________________________________________')
          }
          else if (entry.kind === "directory") {
            if (parentId == null) {
              treeData.push ({
                id: id,
                text: entry.name,
                value: "",
                icon: "",
                opened: "true",
                selected: "false",
                disabled: "false",
                loading: "false",
                parent: parentId ?? '#',
                children: []
              })
            }
            else {
              await this.assign(treeData, path, {
                id: id,
                text: entry.name,
                value: "",
                icon: "",
                opened: "true",
                selected: "false",
                disabled: "false",
                loading: "false",
                parent: parentId ?? '#',
                children: []
              })
            }
            //Going deeper in the folder structure by opening another directory by accessing this function again (nested)
            //Therefore updating the array to pass the current tree path to the assign function later
            
            //This is hardcoded. The index has to be calculated from the parentId. How?
            // if (id == 3) {
            //   parentIndex = 1
            // }
            // else {
            //   parentIndex = 0
            // }

            if (parentId == null) {
              parentIndex = 0
            }
            else {
              await this.getIndex(treeData, path, id)
            }
            
            // console.log('dir_id: ' + id)
            // console.log('dir_path: ' + path)
            // console.log('parentId: ' + parentId)
            // console.log('parentIndex: ' + parentIndex)

            // Creating the path of this directory
            path.push(parentIndex); //parentIndex = 0 is the initial state when the function is first run (hence at this part the first directory is opened)
            path.push('children');

            await this.getFiles(entry, id, path)

          }
        }
        //When reaching this part of the function the deeper laying folder structures have been finished processing
        //Therefore updating the array to move up one folder in the path
        arrayLength = path.length
        if (arrayLength >> 0) {
          newArrayLength = arrayLength - 2
        }
        path.length = newArrayLength
      },

      async assign(obj, keyPath, value) { //Source: https://stackoverflow.com/questions/5484673/javascript-how-to-dynamically-create-nested-objects-using-object-names-given-by
        lastKeyIndex = keyPath.length - 1;
        for (var i = 0; i < lastKeyIndex; ++ i) {
          key = keyPath[i];
          if (!(key in obj)){
            obj[key] = {}
          }
          obj = obj[key];
        }
        obj[keyPath[lastKeyIndex]].push(value);
      },

      async getIndex(obj, keyPath, id) {
        lastKeyIndex = keyPath.length - 1;
        for (var i = 0; i < lastKeyIndex; ++ i) {
          key = keyPath[i];
          if (!(key in obj)){
            obj[key] = {}
          }
          obj = obj[key];
        }
        parentIndex = obj[keyPath[lastKeyIndex]].findIndex(x => x.id === id)

        // console.log('_____________________________________________')
        // console.log('path: ' + keyPath)
        // console.log('id: ' + id)
        // console.log(obj[keyPath[lastKeyIndex]])
        // console.log(obj[keyPath[lastKeyIndex]].findIndex(x => x.id === id))
        // console.log(parentIndex)
        // console.log('.............................................')
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