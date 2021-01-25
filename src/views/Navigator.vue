<template>
  <div class="hello">
      <div>
        <img src="../assets/logo.png" alt="Blankscape" width="50">
      </div>
      <div>
        <router-link to="/">Back to the Startscreen</router-link>
        <Home msg="Welcome to Your Vue.js App"/>
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
  }
}
</script>
