<template>
  <div>
    <div>
      <img src="../assets/logo.png" alt="Blankscape" width="200">
    </div>
    <h1>{{ msg }}</h1>
    <router-link to="/Navigator">Show me what you got</router-link>
  </div>
</template>

<script>

  export default {
    name: 'Startscreen',
    components: {
      
    },

    data () {
      return {
        msg: 'Blankscape',
      }
    },
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
