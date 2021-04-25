import Vue from 'vue';
import Accueil from './views/Accueil.vue';
import Router from 'vue-router';

Vue.use(Router)

export default new Router({
    routes: [
        {
            path: '/',
            component: Accueil,
        },
        {
            path: '/acceuil',
            name: 'accueil',
            component: Accueil,
        }
    ]
})
