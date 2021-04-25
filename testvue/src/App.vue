<template>
  <div id="app"> 
    <div class="page-container container">
      <h1>POE Trend</h1>
      <div class="content mt-5">
      </div>
    </div>
        <router-view/>
  </div>
</template>
<script>
import api from "./api"
import Nl2br from "vue-nl2br";

export default {
  data() {
    return {
      informations: 1,
    };
  },
  components: {
    Nl2br
  }
};
</script>
<style>
html {
  background: gray;
  display: block;
}
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #b0c9e2;
  margin-top: 60px;
  background-color: #071336;
}
body{
  
}

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
