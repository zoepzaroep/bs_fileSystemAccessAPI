<template>
  <div class="panel">
      <div class="header">
        FilePanel Component
      </div>
      <div class="header">
        <textarea ref="editor" id="editor" cols="30" rows="10" placeholder="Textarea"></textarea>
      </div>
  </div>
</template>

<style scoped>

.panel {
  max-height: 100%;
}

.header {
  display: block; /* float: left; & width: 100%; together have the same effect */
  text-align: left;
}

</style>