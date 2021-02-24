<template>
  <div class="hello">
    <div>
      <img src="../assets/logo.png" alt="Blankscape" width="200">
    </div>
    <h1>{{ msg }}</h1>
    <div>
      <button v-on:click="openFile()">Open</button>
      <button v-on:click="saveFile()">Save</button>
      <button v-on:click="openFolder()">Open Folder</button>
      <textarea v-if="treeData.length > 0" id="editor" cols="30" rows="10" placeholder="Textarea"></textarea>
      <router-link to="/Navigator">Show me what you got</router-link>
      <v-jstree ref="tree" :data="treeData" show-checkbox multiple allow-batch whole-row @item-click="itemClick"></v-jstree>
    </div>
  </div>
</template>

<script>

  import VJstree from 'vue-jstree'

  //Declaring a varibale here makes it available for all methods below
  let fileHandle;
  let folder;
  let treeData = [];
  let id = 0;
  let key;
  let Index = 0; //The index of the array of the currently processed object

  export default {
    name: 'Startscreen',
    components: {
      VJstree
    },

    data () {
      return {
        msg: 'Blankscape',
        treeData //returns a global version of treeData which can be passed through to the child component (see above)
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
        while (treeData.length > 0) {
            treeData.pop();
        } //According to the internet, this is performance wise the fastest way to empty an array. Funny enough, this is also the only way updating the vue-jstree works after emptying the array. The most intuitive command "treeData = []" empties the array but somehow does not trigger the data update of components in the template. No idea why - search the whole internet for hours for this issue
        
        // this.globalTreeData = [this.$refs.tree.initializeLoading()];
        folder = await window.showDirectoryPicker();
        await this.getFiles(folder);
        console.log(treeData)
        // return 'treeData'
        // this.$router.push({ path: '/Navigator' })
      },

      async getFiles(folder, parentId = null, path = []) {

        //Files and folders come alphabetically from API

        for await (const entry of folder.values()) {
          
          //i has to be incrimented at the beginning because this for function is nested and multiple times called within itself befor finishing
          id++ //This starts with the id = 1 for the first object

          if (entry.kind === "file") {
            await this.assign(treeData, path, { //Array/Object structure: https://zdy1988.github.io/vue-jstree/
              id: id,
              text: entry.name,
              value: "",
              icon: "",
              opened: "true",
              // selected: "false",
              disabled: "true",
              // loading: "false",
              parent: parentId ?? '#',
              children: []
            })
            // console.log('_____________________________________________')
            // console.log('_________________________________________FILE')
            // console.log('file_id: ' + id)
            // console.log('file_path: ' + path)
            // console.log('parentId: ' + parentId)
          }
          else if (entry.kind === "directory") {
            await this.assign(treeData, path, {
              id: id,
              text: entry.name,
              value: "",
              icon: "",
              opened: "true",
              // selected: "false",
              // disabled: "false",
              // loading: "false",
              parent: parentId ?? '#',
              children: []
            })
            // console.log('_____________________________________________')
            // console.log('____________________________________DIRECTORY')
            // console.log('dir_id: ' + id)
            // console.log('dir_path: ' + path)
            // console.log('parentId: ' + parentId)

            //Get index of the current entry
            await this.getIndex(treeData, path, id)
  
            // console.log('dir_Index: ' + Index)

            // Creating the path of this directory
            await this.moveDown(path)

            //Going deeper in the folder structure by opening another directory by accessing this function again (nested)
            //Therefore updating the array to pass the current tree path to the assign function later
            await this.getFiles(entry, id, path)

          }
        }
        
        //When reaching this part of the function the deeper laying folder structures have been finished processing
        //Therefore updating the array to move up one folder in the path (if not already on the root level - which is considered within the moveUp function)
        await this.moveUp(path)

        // return treeData
      },

      async assign(obj, keyPath, value) { //Source: https://stackoverflow.com/questions/5484673/javascript-how-to-dynamically-create-nested-objects-using-object-names-given-by
        
        let keyPathLength = keyPath.length

        if (keyPathLength < 2) {
          obj.push(value)
          // console.log(obj)
        }
        else {
          let lastKeyIndex = keyPath.length - 1;
          for (var i = 0; i < lastKeyIndex; ++ i) {
            key = keyPath[i];
            if (!(key in obj)){
              obj[key] = {}
            }
            obj = obj[key];
          }
          obj[keyPath[lastKeyIndex]].push(value);
          // console.log(obj[keyPath[lastKeyIndex]])
        }
      },

      async getIndex(obj, keyPath, id) {
        
        let keyPathLength = keyPath.length

        if (keyPathLength < 2) {
          Index = obj.findIndex(x => x.id === id)
          // console.log(obj)
        }
        else {
          let lastKeyIndex = keyPath.length - 1;
          for (var i = 0; i < lastKeyIndex; ++ i) {
            key = keyPath[i];
            if (!(key in obj)){
              obj[key] = {}
            }
            obj = obj[key];
          }
          Index = obj[keyPath[lastKeyIndex]].findIndex(x => x.id === id)
          // console.log(obj[keyPath[lastKeyIndex]])
        }
      },

      async moveDown(path) {
            path.push(Index); //parentIndex = 0 is the initial state when the function is first run (hence at this part the first directory is opened)
            path.push('children');
      },

      async moveUp(path) {
        let arrayLength = path.length

        // console.log('_____________________________________________')
        // console.log('___________________________________UP_A_LEVEL')
        // console.log('path: ' + path)
        // console.log('arrayLength: ' + arrayLength)

        //The path.length cannot be negative, hence negative values do not have to be considered ()
        if (arrayLength > 0) {
          let newArrayLength = arrayLength - 2
          path.length = newArrayLength
        }

        // console.log('newPath: ' + path)
        // console.log('newArrayLength: ' + newArrayLength)
      },

      itemClick (node) { //Source: https://github.com/zdy1988/vue-jstree
        console.log(node.model.text + ' clicked !')
      },

      keyDown: function () {
        const activeElement = document.getElementsByClassName('active')[0]
        if (activeElement && !isNaN(event.key) && event.key > 0) {
          activeElement.innerHTML = event.key
        }
      },
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

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1, h2 {
  font-weight: normal;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
