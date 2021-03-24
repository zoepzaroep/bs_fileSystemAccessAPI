<template>
  <div>
    <div class="column tree">
      <div>
        <div class="header">
          TreePanel
        </div>
        <div class="header">
          <v-btn v-on:click="openFile()">Open new file</v-btn>
          <v-btn v-on:click="writeFile()">Save current file</v-btn>
          <v-btn v-on:click="openRootFolder()">Open new Folder</v-btn>
          <v-btn v-on:click="test()">Test</v-btn>
        </div>
      </div>
      <div>
        <v-treeview
          class="treeText"
          ref="folderTree"
          v-if="show"
          dense
          :items="folderTree"
          activatable
          hoverable
          return-object
          :load-children="getSubFolders"
          @update:active="folderSelect"
        >
          <!-- "@update:active="itemClick"": Alternative way to trigger a function call on-click is by listening for clicks on the label. This however only triggers if the label (text) is clicked diretcly not when clicked on the whole row besides the text. Source: https://stackoverflow.com/questions/54719453/how-to-bind-an-event-to-a-treeview-node-in-vuetify/54719701 -->
          <!-- "v-if": Is necessary otherwise "open-all" does not work because the ":items" have no array asigned yet during page rendering -->
          <!-- "return-object": Makes the treeview return the whole object (not only the id) in events like @update. Here: the whole object is passed through to the function called by "@update:active" -->
        </v-treeview>
      </div>
    </div>
    <div class="column folder">
      <div class="header">
        FolderPanel
      </div>
      <div>
        Files in the folder "{{folderName}}":
        <v-data-table
          class="treeText"
          ref="rootFileTree"
          v-if="show"
          :headers="headers"
          :items="rootFileTree"
        >
          <template v-slot:item="{ item }">
            <tr @click="rootFileSelect(item)">
              <td>{{item.name}}</td>
              <td>{{item.id}}</td>
              <td>{{item.systemPath}}</td>
              <td>{{item.obj}}</td>
            </tr>
          </template>
          <!-- Source: https://stackoverflow.com/questions/59313008/select-rows-in-vuetify-data-table -->
        </v-data-table>
      </div>
      <div>
        Files in the subfolders of "{{folderName}}":
        <v-treeview
          class="treeText"
          ref="subFileTree"
          v-if="show"
          open-all
          dense
          :items="subFileTree"
          activatable
          selectable
          hoverable
          return-object
          :active="subFileTreeActivity"
          @update:active="subFileSelect"
        >
          <!-- ":active"; Is an array assigned with which the active nodes of the tree (marked grey when selected) can be set and reset -->
        </v-treeview>
      </div>
    </div>
    <div class="column file">
      <div class="header">
        FilePanel
      </div>
      <div>
        <v-textarea
          v-model="content"
          label="Textarea default style"
          hint="This is a hint text">
        </v-textarea>
      </div>
    </div>
  </div>
</template>

<script>

  // import store from "@/store";
  import { get, set } from 'idb-keyval';
  

  // Declaring a varibale here makes it available for all methods below but not for the template above (therefore the variable has to be returned below)
  let fileHandle; // Is set in the "readFile" function to cache which file (and its corresponding FileSystemAPI entry) is selected
  let dirHandle;
  let currentIndexfileHandle; // Is set in the "readIndexFile" function when searching for the index file while opening the folder initially. It is recalled in the "readRootFile" and "readSubFile" function to reset the FilePanel to show the index of the folder when no node of the tree is selected
  let rootFolder; // Is set in the "openRootFolder" function. It contains the whole response of the FileSystemAPI of the user-opened folder. This data is later iterated through in the "getRootFolders" function to push every entry (every file and directory) to an array. Furthermore, the whole "folder" is necessary in the "readIndexFile" and the "readFile" function to get the physical path (.resolve()) of a specified entry
  let folderTree = []; // Is filled in the "getRootFolders" function with only the directory responses of the FileSystemAPI. The folderTree contains all the entries in a v-treeview readable structure and is used directly for the "folderTree" v-treeview.
  let rootFileTree = []; // Is filled in the "getRootFiles" and "getSubFiles" function. The "rootFileTree" has only one dimension (not nested) and is a list of all the files of a selected folder
  let subFileTree = []; // Is filled in the "getSubFiles" function. The "subFileTree" has only one dimension (not nested) and is a list of all the files of all the subfolders of a selected folder
  let rootFileTreeActivity = []; // Is used to reset the active nodes of the rootFileTree and is called from the "readSubFile" function
  let subFileTreeActivity = []; // Is used to reset the active nodes of the subFileTree and is called from the "readRootFile" function
  let folderNameRoot = "/"; // Is used to reset the folderName to its initial state "/" within the "openRootFolder" and the "itemClick" function
  let folderName = folderNameRoot; // Is assigned the name of the currently opened folder in the "itemClick" function. The folderName is used for the titles of the dividers in the FolderPanel. Initially "/" symbolises the root level.
  let content = "";
  let show = false;
  let rootFileSelected = false; // Is set in the "readRootFile" function to true to indicate that a node in the "rootFileTree" is selected
  let subFileSelected = false; // Is set in the "readSubFile" function to true to indicate that a node in the "subFileTree" is selected
  let id = 0;
  let indexName = "bs_index.txt";
  let nestedLevel = 0; // getSubFiles() detect if on root level of the folder or sub level (to not add root level files to the subFilesTree)

  export default {
    name: 'Browser',
    components: {
      
    },

    data () {
      return { // returns a global variable which can be passed through to child components and the template above
        fileHandle,
        dirHandle,
        currentIndexfileHandle,
        rootFolder,
        folderTree,
        rootFileTree,
        subFileTree,
        rootFileTreeActivity,
        subFileTreeActivity,
        folderName,
        content,
        show,
        rootFileSelected,
        subFileSelected,
        headers: [
          {
            text: 'Filename',
            align: 'start',
            sortable: false,
            value: 'name',
          },
          { text: 'ID', value: 'id' },
          { text: 'Path', value: 'systemPath' },
          { text: 'Type', value: 'obj' },
        ],
      }
    },

    methods: {

      async fetchUsers (item) {

        console.log(item.systemPath)
        return fetch('https://jsonplaceholder.typicode.com/users')
          .then(res => res.json())
          .then(json => (item.children.push(...json)))
          .catch(err => console.warn(err))
      },



      async openFile() { // Template to open a single file from the system via the FileSystemAPI - Source: https://web.dev/file-system-access/
        let [fileHandle] = await window.showOpenFilePicker();
        const file = await fileHandle.getFile();
        
        // Test encryption/decryption
        this.$aes.setKey("myPassword")
        let encrypted = this.$aes.encrypt(await file.text())
        console.log(encrypted)
        let decrypted = this.$aes.decrypt(encrypted)
        this.content = decrypted;
      },

      async openRootFolder() { // This function opens a folder from the hard drive via the FileSystemAPI - Inspired by: https://www.youtube.com/watch?v=csCk4mrEmm8
        
        this.show = false // Resetting the visibility of the v-treeview modules in the template. If this is not done prior to assigning new data arrays (when opening a new folder after already showing one), the new v-treeview´s will intially show all nodes collapsed even though the attribute "open-all" is assigned to them

        // Resetting all arrays: According to the internet, this is performance wise the fastest way to truly empty an array. Funny enough, this is also the only way updating the vue-jstree works after emptying the array. The most intuitive command "dataTree = []" empties the array but somehow does not always trigger the data update of components in the template (sometimes emptying works but on re-filling update is broken again). No idea why - search the whole internet for hours for this issue
        while (folderTree.length > 0) {
            folderTree.pop();
        }
        while (rootFileTree.length > 0) {
            rootFileTree.pop();
        }
        while (subFileTree.length > 0) {
            subFileTree.pop();
        }

        this.folderName = folderNameRoot // Resetting the folderName to the initial state (the folderName is used for the titles of the dividers in the FolderPanel)

        this.rootFolder = await window.showDirectoryPicker() // Files and folders come alphabetically from the FileSystemAPI (not sorted by files or folders)
        this.dirHandle = this.rootFolder
        await this.getRootFolders(this.dirHandle) // Passing the response of the FileSystemAPI down to the "getRootFolders" function where the whole folder is iterated through

        this.getRootFiles(this.dirHandle)

        this.show = true // Making the v-treeview modules in the template visible

        console.log(this.folderTree) // Somehow when logging the dataTree in the console, it is kind of not shown correctly. The values of the nested objects cannot be seen in the console
      },

      async folderSelect(node) { // Source: https://github.com/zdy1988/vue-jstree

        while (rootFileTree.length > 0) { // The rootFileTree array is becoming entry´s pushed into. This array has to be emptied everytime the function is called
            rootFileTree.pop();
        }
        while (subFileTree.length > 0) { // The subFileTree array is becoming entry´s pushed into. This array has to be emptied everytime the function is called
            subFileTree.pop();
        }

        // The treeview returns the whole object of the clicked entry. Under index [0] all the object´s attributes can be called
        if (node.length === 0) { // When de-selecting the entry in the treeview it is returning an empty array, which would lead to an error
          this.dirHandle = this.rootFolder // Necessary to save it in the dirHandler coz getSubFiles() may use the dirHandle at a later point in time
          this.getRootFiles(this.dirHandle)
          console.log("node de-selected")
          this.folderName = folderNameRoot // Resetting the folderName to the initial state (the folderName is used for the titles of the dividers in the FolderPanel)
        }
        else {
          console.log(node[0].name + ' selected')
          this.folderName = node[0].name

          // Clear the FilePanel
          this.content = ""
          
          get(node[0].systemPath.join('/') + '/' + node[0].name).then(async dirHandle => {
            this.dirHandle = dirHandle
            this.getRootFiles(dirHandle) // Adding all the files (that are on root level of the clicked folder) to the rootFileTree array and combining all the files in subfolders in the subFileTree
          })
        }
      },

      async rootFileSelect(node) { // This function is called by the v-treeview that shows the root files of a selected folder ("rootFileTree"). It resets the selection of nodes in the "subFileTree", calls the "readFile" function to show the selected file in the FilePanel and shows the index file of the folder when no node is selected at all
        
        // console.log("works")

        if (node.length === 0) { // When de-selecting the node in the "rootFileTree" it is returning an empty array. With "node.length === 0" a deselection can be observed
          console.log("entry de-selected")
          this.rootFileSelected = false
          if (this.rootFileSelected === false && this.subFileSelected == false) { // When neither in the rootFileTree nor in the subFileTree a node is selected, resetting the content of the FilePanel to the index of the selected folder
            console.log("resetting index")
            let file = await currentIndexfileHandle.getFile(); // "currentIndexfileHandle" was set in the "readIndexFile" function when searching for the index file while opening the folder initially
            this.content = await file.text();
          }
        }
        else {
          this.subFileTreeActivity = [] // Resetting the active nodes of the subFileTree (if any)
          this.rootFileSelected = true

          get(node.systemPath.join('/') + '/' + node.name).then(async fileHandle => {
            this.readFile(fileHandle)
          })
        }
      },

      async subFileSelect(node) { // This function is called by the v-treeview that shows the sub files of a selected folder ("subFileTree"). It resets the selection of nodes in the "rootFileTree", calls the "readFile" function to show the selected file in the FilePanel and shows the index file of the folder when no node is selected at all
        if (node.length === 0) { // When de-selecting the node in the "subFileTree" it is returning an empty array. With "node.length === 0" a deselection can be observed
          console.log("entry de-selected")
          this.subFileSelected = false
          if (this.rootFileSelected === false && this.subFileSelected == false) { // When neither in the subFileTree nor in the rootFileTree a node is selected, resetting the content of the FilePanel to the index of the selected folder
            console.log("resetting index")
            let file = await currentIndexfileHandle.getFile(); // "currentIndexfileHandle" was set in the "readIndexFile" function when searching for the index file while opening the folder initially
            this.content = await file.text();
          }
        }
        else {
          this.rootFileTreeActivity = [] // Resetting the active nodes of the rootFileTree (if any)
          this.subFileSelected = true

          get(node[0].systemPath.join('/') + '/' + node[0].name).then(async fileHandle => {
            this.readFile(fileHandle)
          })
        }
      },

      async getRootFolders(folder) { // This function iterates through the response of the FileSystemAPI and saves the response into an array which has the right strucutre for the v-treeview component - Inspired by: https://www.youtube.com/watch?v=csCk4mrEmm8

        for await (const entry of folder.values()) {
          
          id++ // This starts with the id = 1 for the first object. The id has to be incrimented at the beginning (not the end) of this loop because this "for" function is nested and multiple times recalled within itself befor finishing

          let systemPath = await this.rootFolder.resolve(entry);
          // Save all fileHandlers in the IndexedDB not by id but by unique "path + filename"
          set(systemPath.join('/') + '/' + entry.name, entry);

          // Declaring the Objects which is individually and recursivly pushed into the tree structure arrays
          let dirDataObj = {
            id: id,
            name: entry.name,
            systemPath: systemPath.map((x) => x), // see description under fileObj
            obj: "directory",
            children: []
          };

          if (entry.kind === "directory") {
            folderTree.push(dirDataObj)
          }
        }
      },

      async getSubFolders(item) { // This function iterates through the response of the FileSystemAPI and saves the response into an array which has the right strucutre for the v-treeview component - Inspired by: https://www.youtube.com/watch?v=csCk4mrEmm8

        return get(item.systemPath.join('/') + '/' + item.name).then(async dirHandle => { // return is necessary to make the treeview update correctly
          this.dirHandle = dirHandle

          for await (const entry of dirHandle.values()) {
            
            id++ // The id has to be incrimented at the beginning (not the end) of this loop because this "for" function is nested and multiple times recalled within itself befor finishing

            let systemPath = await this.rootFolder.resolve(entry);
            // Save all fileHandlers in the IndexedDB not by id but by unique "path + filename"
            set(systemPath.join('/') + '/' + entry.name, entry);

            // Declaring the Objects which is individually and recursivly pushed into the tree structure arrays
            let dirDataObj = {
              id: id,
              name: entry.name,
              systemPath: systemPath.map((x) => x), // see description under fileObj
              obj: "directory",
              children: []
            };

            if (entry.kind === "directory") {
              item.children.push(dirDataObj)
            }
          }
        })
      },

      async getRootFiles(dirHandle) {
          
          for await (const entry of dirHandle.values()) {
            
            id++ // The id has to be incrimented at the beginning (not the end) of this loop because this "for" function is nested and multiple times recalled within itself befor finishing

            let systemPath = await this.rootFolder.resolve(entry);
            // Save all fileHandlers in the IndexedDB not by id but by unique "path + filename"
            set(systemPath.join('/') + '/' + entry.name, entry);

            // Declaring the Objects which is individually and recursivly pushed into the tree structure arrays
            let fileObj = { // Objects which are pushed to the tree arrays for every entry from the FileSystemAPI - Array/Object structure: https://vuetifyjs.com/en/components/treeview/#api
              id: id, // Unique id
              name: entry.name, // Name that is shown in the v-treeview as title of the node
              systemPath: systemPath.map((x) => x), // The systemPath has the following structure: "//folder/subfolder/etc." e. g. "//root/branch" (the own filename is excluded of the path but saved under value "name" above) - With the command join the apiPath array is transformed into a string and combined with the seperator '/' - This string is used to retrieve the fileHandlers from the IndexedDB in the funcitons "readFile" & "readIndexFile"
              obj: "file",
              children: []
            };

            if (entry.kind === "file") {
              if (entry.name === indexName) {
                console.log("index detected")
                await this.readIndexFile(entry)
              }
              else {
                rootFileTree.push(fileObj)
              }
            }
          }
      },

      async getSubFiles(dirHandle) {

        for await (const entry of dirHandle.values()) {
          
          id++ // The id has to be incrimented at the beginning (not the end) of this loop because this "for" function is nested and multiple times recalled within itself befor finishing

          let systemPath = await this.rootFolder.resolve(entry);

          // Save all fileHandlers in the IndexedDB not by id but by unique "path + filename"
          set(systemPath.join('/') + '/' + entry.name, entry);

          // Declaring the Object which is individually and recursivly pushed into the tree structure arrays
          let fileObj = { // Objects which are pushed to the tree arrays for every entry from the FileSystemAPI - Array/Object structure: https://vuetifyjs.com/en/components/treeview/#api
            id: id, // Unique id
            name: entry.name, // Name that is shown in the v-treeview as title of the node
            systemPath: systemPath.map((x) => x), // The systemPath has the following structure: "//folder/subfolder/etc." e. g. "//root/branch" (the own filename is excluded of the path but saved under value "name" above) - With the command join the apiPath array is transformed into a string and combined with the seperator '/' - This string is used to retrieve the fileHandlers from the IndexedDB in the funcitons "readFile" & "readIndexFile"
            obj: "file",
            children: []
          };

          if (entry.kind === "file") {
            if (nestedLevel !== 0) {
              if (entry.name !== indexName) {
                subFileTree.push(fileObj)
              }
            }
          }
          else if (entry.kind === "directory") {
            nestedLevel++
            await this.getSubFiles(entry)
            nestedLevel--
          }
        }
      },

      async readIndexFile(fileHandle) { // This function is called by the "getRootFiles" and "getSubFiles" function. It searches the selected folder for the index file to show in the FilePanel when opening the folder initially
        this.fileHandle = fileHandle
        currentIndexfileHandle = fileHandle
        let file = await fileHandle.getFile();
        this.content = await file.text();
      },

      async readFile(fileHandle) { // This function is called by the "readRootFile" and "readSubFile" function. It searches the selected folder or subfolder for the (in the tree) selected file to show its content in the FilePanel         
        this.fileHandle = fileHandle
        let file = await fileHandle.getFile();
        this.content = await file.text();
      },

      async writeFile() { // This function saves the currently selected file which is shown in the FilePanel to the system via the FileSystemAPI - Source: https://web.dev/file-system-access/
        let writable = await this.fileHandle.createWritable(); // creating the fileHandler (for writing to the file system) from the currently selected file which is cached in "currentEntry" which was set in the "readFile" function
        await writable.write(this.content);
        await writable.close();
      },

      async test() { // Test-function to test various functions
         // test if the Vuex setup works
/*         this.$store.commit('increment')
        console.log(store.state.count) */
        
        // test encryption/decryption
/*         this.$aes.setKey("myPassword")
        let secret = "secret message"
        console.log(secret)
        let encrypted = this.$aes.encrypt(secret)
        console.log(encrypted)
        let decrypted = this.$aes.decrypt(encrypted)
        console.log(decrypted) */

/*        get(5).then((val) => console.log(val)); */

        this.getSubFiles(this.dirHandle)

      },
    },

    created: function () {
      window.addEventListener('keydown', e => {
        if (e.key === 's' && e.metaKey){
          e.preventDefault();
          this.saveFile()
        }
      })     
    },

    destroyed: function () {
      
    }
  }
</script>

<style scoped>

.column {
  float: left;
  max-height: calc((100vh - 200px));
  overflow: auto;
}

.tree {
  width: 25%; /* 25% of the whole window */
}

.treeText {
  text-align: left;
}

.folder {
  width: 25%; /* 25% of the whole window */
}

.file {
  width: 50%; /* 50% of the whole window */
}

.header {
  display: block; /* float: left; & width: 100%; together have the same effect */
  text-align: left;
}

</style>