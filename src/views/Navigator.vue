<template>
  <div class="hello">
      <div>
        <img src="../assets/logo.png" alt="Blankscape" width="50">
      </div>
      <div>
        <router-link to="/">Back to the Startscreen</router-link>
      </div>
      <div class="row">
        <div>
          <TreePanel />
        </div>
      </div>
  </div>
</template>

<script>
// @ is an alias to /src
import TreePanel from '@/components/TreePanel.vue'

export default {
  name: 'Navigator',
  components: {
    TreePanel,
  },
  methods: {

  }
}
</script>

<style scoped>

</style>