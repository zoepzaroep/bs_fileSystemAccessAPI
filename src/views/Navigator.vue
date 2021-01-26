<template>
  <div class="hello">
      <div>
        <img src="../assets/logo.png" alt="Blankscape" width="50">
      </div>
      <div>
        <router-link to="/">Back to the Startscreen</router-link>
        <Home v-on:open-File="openFile"/>
        <Link1 />
        <Link2 />
      </div>
  </div>
</template>

<script>
// @ is an alias to /src
import Home from '@/components/Home.vue'
import Link1 from '@/components/Link1.vue'
import Link2 from '@/components/Link2.vue'

export default {
  name: 'Navigator',
  components: {
    Home,
    Link1,
    Link2
  },
  methods: {
    async openFile() {
        let fileHandle;
        let textArea = document.getElementById('editor');
        [fileHandle] = await window.showOpenFilePicker();
        const file = await fileHandle.getFile();
        const contents = await file.text();
        textArea.value = contents;
      }
  }
}
</script>
