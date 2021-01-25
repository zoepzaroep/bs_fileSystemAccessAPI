<template>
  <div class="hello">
      <div id="div">
        Home Component - Message from Navigator.vue: {{msg}}
      </div>
      <button v-on:click="openFile()">Open</button>
      <button v-on:click="saveFile()">Save</button>
      <textarea id="editor" cols="30" rows="10" placeholder="Textarea"></textarea>
  </div>
</template>

<script>
  export default {
    name: 'Home',
    // data() {
    //   return {
    //     fileHandle: ''
    //   }
    // },
    methods: {
      async openFile() {
        let fileHandle;
        let textArea = document.getElementById('editor');
        [fileHandle] = await window.showOpenFilePicker();
        const file = await fileHandle.getFile();
        const contents = await file.text();
        textArea.value = contents;
      },
      async saveFile() {
        let fileHandle;
        let textArea = document.getElementById('editor');
        [fileHandle] = await window.showOpenFilePicker();
        const file = await fileHandle.getFile();
        const contents = await file.text();
        textArea.value = contents;
        let writable = await fileHandle.createWritable();
        await writable.write(textArea.value);
        await writable.close();
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
