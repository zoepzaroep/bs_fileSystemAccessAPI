<template>
  <v-app>
    <div>
      <div class="column tree">
        <div>
          <div class="header">
            TreePanel
          </div>
          <div class="header">
            <v-btn v-on:click="openFile()">Open new file</v-btn>
            <v-btn v-on:click="writeFile()">Save current file</v-btn>
            <v-btn v-on:click="openFolderClick()">Open new Folder</v-btn>
            <!-- <v-btn v-on:click="test()">Test</v-btn> -->
          </div>
        </div>
        <div>
          <v-treeview
            ref="folderTree"
            class="treeText"
            v-if="show"
            dense
            :items="folderTree"
            activatable
            hoverable
            return-object
            :load-children="getSubFolders"
            @update:active="folderClick"
          >
            <template v-slot:label="{ item }">
              <span class="treeText" :class="{'treeTextSelected': item.id === selectedFolder}">
                <!-- The class has to be passed inside the span component (not the parent v-treeview component), otherwise the text color is not assigned -->
                {{ item.name }}
              </span>
            </template>
            <!-- "@update:active="itemClick"": Alternative way to trigger is via the template and "@click". This however only triggers if the label (text) is clicked diretcly not when clicked on the whole row besides the text. Source: https://stackoverflow.com/questions/54719453/how-to-bind-an-event-to-a-treeview-node-in-vuetify/54719701 -->
            <!-- "return-object": Makes the treeview return the whole object (not only the id) in events like @update. Here: the whole object is passed through to the function called by "@update:active". There the values of the object can be accessed under index "0". Hence the values are called from "node[0]" -->
          </v-treeview>
        </div>
      </div>
      <div class="column folder">
        <div class="header">
          FolderPanel
        </div>
        <v-dialog
          v-model="dialog"
          persistent
          max-width="290"
        >
          <v-card>
            <v-card-title class="headline">
              Changes on the file system
            </v-card-title>
            <v-card-text>Some files changed on the file system via external applications. The files were reloaded in the background.</v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn
                color="green darken-1"
                text
                @click="confirm = true"
              >
                Confirm
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
        
        <div>
          Files in the folder "{{selectedFolderName}}":
          <v-data-table
            ref="rootFileTree"
            v-if="show"
            :headers="headers"
            hide-default-footer
            :items-per-page="-1"
            :items="rootFileTree"
          >
            <template v-slot:item="{ item, index }">
              <tr @click="fileClick(item)" :key="index" class="dataText" :class="{'dataTextSelected': item.id === selectedFile}">
                <td>{{item.name}}</td>
                <td>{{item.systemPath.join('/')}}</td>
                <td>{{item.obj}}</td>
              </tr>
            </template>
            <!-- @click makes custom syling not being applied on the first row. Have to define the key property to make that work - Source: https://www.reddit.com/r/vuetifyjs/comments/iv721e/click_causing_first_tablerow_item_in_vdatatable/ -->
            <!-- Source: https://stackoverflow.com/questions/59313008/select-rows-in-vuetify-data-table -->
          </v-data-table>
        </div>
        <div>
          Files in the subfolders of "{{selectedFolderName}}":
          <v-btn v-on:click="showSubFiles(dirHandle)">Show Subfiles</v-btn>
          <v-data-table
            ref="subFileTree"
            v-if="show"
            :headers="headers"
            hide-default-footer
            :items-per-page="-1"
            :items="subFileTree"
          >
            <template v-slot:item="{ item, index }">
              <tr @click="fileClick(item)" :key="index" class="dataText" :class="{'dataTextSelected': item.id === selectedFile}">
                <td>{{ item.name }}</td>
                <td>{{ item.systemPath.join('/') }}</td>
                <td>{{ item.obj }}</td>
              </tr>
            </template>
            <!-- @click makes custom syling not being applied on the first row. Have to define the key property to make that work - Source: https://www.reddit.com/r/vuetifyjs/comments/iv721e/click_causing_first_tablerow_item_in_vdatatable/ -->
            <!-- Source: https://stackoverflow.com/questions/59313008/select-rows-in-vuetify-data-table -->
          </v-data-table>
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
  </v-app>
</template>

<script>

  // import store from "@/store";
  import { get, set } from 'idb-keyval';
  // import { v4 as uuidv4 } from 'uuid';
  import _ from 'lodash';
  
  // Declaring a varibale here makes it available for all methods below but not for the template above (therefore the variable has to be returned below)
  let fileHandle; // Is set in the "readFile" function to cache which file (and its corresponding FileSystemAPI entry) is selected
  let dirHandle;
  let rootFolder; // Is set in the "openRootFolder" function. It contains the whole response of the FileSystemAPI of the user-opened folder. This data is later iterated through in the "getRootFolders" function to push every entry (every file and directory) to an array. Furthermore, the whole "folder" is necessary in the "readIndexFile" and the "readFile" function to get the physical path (.resolve()) of a specified entry
  let folderTree = []; // Is filled in the "getRootFolders" function with only the directory responses of the FileSystemAPI. The folderTree contains all the entries in a v-treeview readable structure and is used directly for the "folderTree" v-treeview.
  let rootFileTree = []; // Is filled in the "loadRootFiles" and "getSubFiles" function. The "rootFileTree" has only one dimension (not nested) and is a list of all the files of a selected folder
  let loadedRootFileTree = [];
  let rootFileTreeLoaded = false;
  let subFileTree = []; // Is filled in the "getSubFiles" function. The "subFileTree" has only one dimension (not nested) and is a list of all the files of all the subfolders of a selected folder
  let loadedSubFileTree = [];
  let subFileTreeLoaded = false;
  let content = "";
  let show = false;
  let selectedFolder = -1;
  let folderNameRoot = "/"; // Is used to reset the selectedFolderName to its initial state "/" within the "openRootFolder" and the "itemClick" function
  let selectedFolderName = folderNameRoot; // Is assigned the name of the currently opened folder in the "itemClick" function. The selectedFolderName is used for the titles of the dividers in the FolderPanel. Initially "/" symbolises the root level.
  let selectedFile = -1;
  let indexName = "bs_index.txt";
  let nestedLevel = 0; // getSubFiles() detect if on root level of the folder or sub level (to not add root level files to the subFilesTree)
  let cancelJob = false;
  let runningJobs = 0;

  export default {
    name: 'Browser',
    components: {
      
    },

    data () {
      return { // returns a global variable which can be passed through to child components and the template above
        fileHandle,
        dirHandle,
        rootFolder,
        folderTree,
        rootFileTree,
        rootFileTreeLoaded,
        subFileTree,
        subFileTreeLoaded,
        content,
        show,
        selectedFile,
        selectedFolder,
        selectedFolderName,
        headers: [
          { text: 'Filename', align: 'start', /* sortable: false, */ value: 'name' },
          { text: 'Path', value: 'systemPath' },
          { text: 'Type', value: 'obj' },
        ],
        selectedRows: [],
        dialog: false,
        confirm: false,
      }
    },

    methods: {

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

      async openFolderClick() {
        // Cancel running jobs
        if (runningJobs > 0) {
          cancelJob = true
          runningJobs = 0
          setTimeout(() => this.openRootFolder(), 300);
        }
        else {
          this.openRootFolder()
        }
      },

      async openRootFolder() { // This function opens a folder from the hard drive via the FileSystemAPI - Inspired by: https://www.youtube.com/watch?v=csCk4mrEmm8
        
        cancelJob = false
        this.show = false // Resetting the visibility of the v-treeview modules in the template. If this is not done prior to assigning new data arrays (when opening a new folder after already showing one), the new v-treeview´s will intially show all nodes collapsed even though the attribute "open-all" is assigned to them
        this.selectedFolderName = folderNameRoot // Resetting the selectedFolderName to the initial state (the folder name is used for the titles of the dividers in the FolderPanel)
        this.selectedFolder = -1
        this.selectedFile = -1
        this.content = ""

        // Resetting all arrays: According to the internet, this is performance wise the fastest way to truly empty an array. Funny enough, this is also the only way updating the vue-jstree works after emptying the array. The most intuitive command "dataTree = []" empties the array but somehow does not always trigger the data update of components in the template (sometimes emptying works but on re-filling update is broken again). No idea why - search the whole internet for hours for this issue
        while (folderTree.length > 0) {
          folderTree.pop();
        }
        while (this.rootFileTree.length > 0) {
          this.rootFileTree.pop();
        }
        while (loadedRootFileTree.length > 0) { // The rootFileTree array is becoming entry´s pushed into. This array has to be emptied everytime the function is called
          loadedRootFileTree.pop();
        }
        while (this.subFileTree.length > 0) {
          this.subFileTree.pop();
        }
        while (loadedSubFileTree.length > 0) { // The subFileTree array is becoming entry´s pushed into. This array has to be emptied everytime the function is called
          loadedSubFileTree.pop();
        }

        try {
          this.rootFolder = await window.showDirectoryPicker() // Files and folders come alphabetically from the FileSystemAPI (not sorted by files or folders)
        }
        catch(err) {
          console.log("The directory picker was not executed by a user gesture. To open a new folder anyway, use the button")
          return
        }

        this.dirHandle = this.rootFolder
        await this.getRootFolders(this.dirHandle) // Passing the response of the FileSystemAPI down to the "getRootFolders" function where the whole folder is iterated through

        await this.loadRootFiles(this.dirHandle)

        this.show = true // Making the v-treeview modules in the template visible

        console.log(this.folderTree) // Somehow when logging the dataTree in the console, it is kind of not shown correctly. The values of the nested objects cannot be seen in the console
      },

      async showSubFiles(dirHandle) {   
        while (this.subFileTree.length > 0) {
          this.subFileTree.pop();
        }
        while (loadedSubFileTree.length > 0) { // The subFileTree array is becoming entry´s pushed into. This array has to be emptied everytime the function is called
          loadedSubFileTree.pop();
        }

        this.loadSubFiles(dirHandle)
      },

      async folderClick(node) {

        // de-select the files in the v-data-table
        this.selectedFile = -1

        // Cancel running jobs
        if (runningJobs > 0) {
          cancelJob = true
          runningJobs = 0
          setTimeout(() => this.folderSelect(node), 300);
        }
        else {
          this.folderSelect(node)
        }
      },

      async folderSelect(node) {
        
        cancelJob = false

        // Clear the FilePanel
        this.content = ""

        while (this.rootFileTree.length > 0) { // The rootFileTree array is becoming entry´s pushed into. This array has to be emptied everytime the function is called
          this.rootFileTree.pop();
        }
        while (loadedRootFileTree.length > 0) { // The rootFileTree array is becoming entry´s pushed into. This array has to be emptied everytime the function is called
          loadedRootFileTree.pop();
        }
        while (this.subFileTree.length > 0) { // The subFileTree array is becoming entry´s pushed into. This array has to be emptied everytime the function is called
          this.subFileTree.pop();
        }
        while (loadedSubFileTree.length > 0) { // The subFileTree array is becoming entry´s pushed into. This array has to be emptied everytime the function is called
          loadedSubFileTree.pop();
        }

        // The treeview returns the whole object of the clicked entry. Under index [0] all the object´s attributes can be called
        if (node.length === 0) { // When de-selecting the entry in the treeview it is returning an empty array, which would lead to an error. In comparision to the other method in "fileClick()" where the node is returned whether it is selected or not, here the node is only returned when selected not deselected due to the "@update:active" method in the template
          console.log("node de-selected")

          this.dirHandle = this.rootFolder // Necessary to save it in the dirHandler coz getSubFiles() may use the dirHandle at a later point in time
          this.loadRootFiles(this.dirHandle)
          this.selectedFolderName = folderNameRoot // Resetting the selectedFolderName to the initial state (the folder name is used for the titles of the dividers in the FolderPanel)
          this.selectedFolder = -1
        }
        else {
          console.log(node[0].name + ' selected')
          this.selectedFolderName = node[0].name
          this.selectedFolder = node[0].id
          
          get(node[0].systemPath.join('/')).then(async dirHandle => {
            this.dirHandle = dirHandle
            this.loadRootFiles(dirHandle) // Adding all the files (that are on root level of the clicked folder) to the rootFileTree array and combining all the files in subfolders in the subFileTree
          })
        }
      },

      async fileClick(node) { // This function is called by the v-treeview that shows the root files of a selected folder ("rootFileTree"). It resets the selection of nodes in the "subFileTree", calls the "readFile" function to show the selected file in the FilePanel and shows the index file of the folder when no node is selected at all

        if (this.selectedFile === node.systemPath.join('/')) {
          
          console.log("entry de-selected - resetting index")
          this.selectedFile = -1;
          this.$set(node, 'selected', false)

          // Make path out of the indexName and the path of the current folder
          let folderPath
          if (this.selectedFolder === -1) {
            folderPath = indexName
          }
          else {
            folderPath = this.selectedFolder + '/' + indexName
          }

          get(folderPath).then(async fileHandle => {
            this.readFile(fileHandle)
          })
          
        }
        else {
          this.selectedFile = node.id;
          this.$set(node, 'selected', true)

          get(node.systemPath.join('/')).then(async fileHandle => {
            this.readFile(fileHandle)
          })
        }
      },

      async getRootFolders(folder) { // This function iterates through the response of the FileSystemAPI and saves the response into an array which has the right strucutre for the v-treeview component - Inspired by: https://www.youtube.com/watch?v=csCk4mrEmm8

        runningJobs++

        for await (const entry of folder.values()) {
          
          if (cancelJob === true) {
            return
          }

          let systemPath = await this.rootFolder.resolve(entry);
          // Save all fileHandlers in the IndexedDB not by random id but by unique "path + filename"
          set(systemPath.join('/'), entry);

          // Declaring the Objects which is individually and recursivly pushed into the tree structure arrays
          let dirDataObj = {
            // id: uuidv4(), // A unique id is necessary for the v-treeview somehow. It is not necessary for the v-data-table however
            id: systemPath.join('/'),
            name: entry.name,
            systemPath: systemPath.map((x) => x), // see description under fileObj
            obj: "directory",
            children: []
          };

          if (entry.kind === "directory") {
            folderTree.push(dirDataObj)
          }
        }

        runningJobs--

      },

      async getSubFolders(item) { // This function iterates through the response of the FileSystemAPI and saves the response into an array which has the right strucutre for the v-treeview component - Inspired by: https://www.youtube.com/watch?v=csCk4mrEmm8
        
        runningJobs++

        return get(item.systemPath.join('/')).then(async dirHandle => { // return is necessary to make the treeview update correctly
          this.dirHandle = dirHandle

          for await (const entry of dirHandle.values()) {
            
            if (cancelJob === true) {
              return
            }

            let systemPath = await this.rootFolder.resolve(entry);
            // Save all fileHandlers in the IndexedDB not by random id but by unique "path + filename"
            set(systemPath.join('/'), entry);

            // Declaring the Objects which is individually and recursivly pushed into the tree structure arrays
            let dirDataObj = {
              // id: uuidv4(), // A unique id is necessary for the v-treeview somehow. It is not necessary for the v-data-table however
              id: systemPath.join('/'),
              name: entry.name,
              systemPath: systemPath.map((x) => x), // see description under fileObj
              obj: "directory",
              children: []
            };

            if (entry.kind === "directory") {
              item.children.push(dirDataObj)
            }
          }

          runningJobs--

        })
      },

      async loadRootFiles(dirHandle) {
        let rootFileTreePath = await this.rootFolder.resolve(dirHandle);

        get('rootFileTree: ' + rootFileTreePath.join('/')).then(async savedRootFileTree => {
          // Catch Error here: If there is no IndexedDB entry yet, first time this "get" function is called, an error is trown coz savedRootFileTree is undefined
          try {
            if (savedRootFileTree.length > 0) {
              this.rootFileTree = savedRootFileTree
              this.rootFileTreeLoaded = true
            }
          }
          catch(err) {
            console.log("no IndexedDB entry yet")
          }
        })

        // push to a temporary loadedRootFileTree
        await this.getRootFiles(dirHandle)

        if (this.rootFileTreeLoaded === true) {       
          // compare the saved rootFileTree with the newly loaded loadedRootFileTree
          if (_.isEqual(loadedRootFileTree, this.rootFileTree)) { // lowdash over stringify because of performance (JSON.stringify(rootFileTree) === JSON.stringify(loadedRootFileTree))
            console.log('loaded from IndexedDB')
          }
          else {  // If changes are detected, prompt before reload the tree and update IndexedDB
            this.dialog = true
            this.awaitUpdate()

            console.log('loaded from FileSystemAPI and updated the IndexedDB')
            this.rootFileTree = loadedRootFileTree
            set(this.rootFolder.name + ' rootFileTree: ' + rootFileTreePath.join('/'), loadedRootFileTree);
          }

          this.rootFileTreeLoaded = false
        }
        else {
          console.log('loaded from FileSystemAPI and saved in the IndexedDB')
          this.rootFileTree = loadedRootFileTree
          set(this.rootFolder.name + ' rootFileTree: ' + rootFileTreePath.join('/'), loadedRootFileTree);
        }
      },

      async getRootFiles(dirHandle) {

        runningJobs++

        for await (const entry of dirHandle.values()) {
          
          if (cancelJob === true) {
            return
          }

          let systemPath = await this.rootFolder.resolve(entry);
          // Save all fileHandlers in the IndexedDB not by random id but by unique "path + filename"
          set(systemPath.join('/'), entry);

          // Declaring the Objects which is individually and recursivly pushed into the tree structure arrays
          let fileObj = { // Objects which are pushed to the tree arrays for every entry from the FileSystemAPI - Array/Object structure: https://vuetifyjs.com/en/components/treeview/#api
            id: systemPath.join('/'),
            name: entry.name, // Name that is shown in the v-treeview as title of the node
            systemPath: systemPath.map((x) => x), // The systemPath has the following structure: "//folder/subfolder/etc." e. g. "//root/branch" (the own filename is excluded of the path but saved under value "name" above) - With the command join the apiPath array is transformed into a string and combined with the seperator '/' - This string is used to retrieve the fileHandlers from the IndexedDB in the funcitons "readFile" & "readIndexFile"
            obj: "file",
            children: []
          };

          if (entry.kind === "file") {
            if (entry.name === indexName) {
              console.log("index detected")
              await this.readFile(entry)
            }
            else {
              loadedRootFileTree.push(fileObj)
            }
          }
        }

        runningJobs--

      },

      async loadSubFiles(dirHandle) {
        let subFileTreePath = await this.rootFolder.resolve(dirHandle);

        get('subFileTree: ' + subFileTreePath.join('/')).then(async savedSubFileTree => {
          // Catch Error here: If there is no IndexedDB entry yet, first time this "get" function is called, an error is trown coz savedRootFileTree is undefined
          try {
            if (savedSubFileTree.length > 0) {
              this.subFileTree = savedSubFileTree
              this.subFileTreeLoaded = true
            }
          }
          catch(err) {
            console.log("no IndexedDB entry yet")
          }
        })

        // push to a temporary loadedSubFileTree
        await this.getSubFiles(dirHandle)

        if (this.subFileTreeLoaded === true) {       
          // compare the saved subFileTree with the newly loaded loadedSubFileTree
          if (_.isEqual(loadedSubFileTree, this.subFileTree)) { // lowdash over stringify because of performance (JSON.stringify(subFileTree) === JSON.stringify(loadedSubFileTree))
            console.log('loaded from IndexedDB')
          }
          else {  // If changes are detected, prompt before reload the tree and update IndexedDB
            this.dialog = true
            this.awaitUpdate()
  
            console.log('loaded from FileSystemAPI and updated the IndexedDB')
            this.subFileTree = loadedSubFileTree
            set(this.rootFolder.name + ' subFileTree: ' + subFileTreePath.join('/'), loadedSubFileTree);
          }

          this.subFileTreeLoaded = false
        }
        else {
          console.log('loaded from FileSystemAPI')
          this.subFileTree = loadedSubFileTree
          set(this.rootFolder.name + ' subFileTree: ' + subFileTreePath.join('/'), loadedSubFileTree);
        }
      },

      async getSubFiles(dirHandle) {

        runningJobs++

        for await (const entry of dirHandle.values()) {
          
          if (cancelJob === true) {
            return
          }

          let systemPath = await this.rootFolder.resolve(entry);

          // Save all fileHandlers in the IndexedDB not by random id but by unique "path + filename"
          set(systemPath.join('/'), entry);

          // Declaring the Object which is individually and recursivly pushed into the tree structure arrays
          let fileObj = { // Objects which are pushed to the tree arrays for every entry from the FileSystemAPI - Array/Object structure: https://vuetifyjs.com/en/components/treeview/#api
            id: systemPath.join('/'),
            name: entry.name, // Name that is shown in the v-treeview as title of the node
            systemPath: systemPath.map((x) => x), // The systemPath has the following structure: "//folder/subfolder/etc." e. g. "//root/branch" (the own filename is excluded of the path but saved under value "name" above) - With the command join the apiPath array is transformed into a string and combined with the seperator '/' - This string is used to retrieve the fileHandlers from the IndexedDB in the funcitons "readFile" & "readIndexFile"
            obj: "file",
            children: []
          };

          if (entry.kind === "file") {
            if (nestedLevel !== 0) {
              if (entry.name !== indexName) {
                loadedSubFileTree.push(fileObj)
              }
            }
          }
          else if (entry.kind === "directory") {
            nestedLevel++
            await this.getSubFiles(entry)
            nestedLevel--
          }
        }

        runningJobs--

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

      async awaitUpdate() {
        if(this.confirm === false) {
          setTimeout(() => this.awaitUpdate(), 1000);
        }
        else {
          this.confirm = false
          this.dialog = false
        }
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
      },
    },

    created: function () {
      this.openFolderClick()
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

.v-data-table {
  background-color: rgba(142, 255, 108, 0.158) !important;
}

.v-treeview {
  background-color: rgba(108, 160, 255, 0.308) !important;
}

.dataText {
  text-align: left;
  color: rgb(0, 0, 0);
}

.dataTextSelected {
  text-align: left;
  color: rgb(43, 151, 0);
  font-weight: 700;
}

.treeText {
  text-align: left;
  color: rgb(0, 0, 0);
  font-size: 15px;
}

.treeTextSelected {
  text-align: left;
  color: rgb(0, 41, 153);
  font-weight: 700;
}

</style>