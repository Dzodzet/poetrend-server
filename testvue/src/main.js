import Vue from 'vue';
import router from './router';
import api from './api';
import Nl2br from 'vue-nl2br';
import store from './store';

import App from './App.vue';

new Vue({
    router,
    store,
    render: h => h(App),
}).$mount('#app'); //