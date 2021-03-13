<template>
  <div>
      <div>
        <img src="../assets/logo.png" alt="Blankscape" width="50">
      </div>
      <div>
        <router-link to="/">Back to the Startscreen</router-link>
      </div>
      <div>
        <div>
          <Browser />
        </div>
      </div>
  </div>
</template>

<script>
// @ is an alias to /src
import Browser from '@/components/Browser.vue'

export default {
  name: 'Navigator',
  components: {
    Browser,
  },
  methods: {

  }
}
</script>

<style scoped>

</style>