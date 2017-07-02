import Vue from 'vue';
import Router from 'vue-router';
import NProgress from 'nprogress';

import Hello from '@/components/Hello';
import Page404 from '@/components/Page404';
//import store from '@/store';

Vue.use(Router);

const router = new Router({

  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'Hello',
      component: Hello
    },
    {
      path: '*',
      component: Page404
    }
  ]
});


router.beforeEach((to, from, next) => {

  NProgress.start();

  // if( (to.name === 'SingIn' || to.name === 'SingUp') && store.getters.isLoggedIn )
  //   router.replace({ path: '/' });

  // if( to.matched.some(record => record.meta.auth) && !store.getters.isLoggedIn )
  //   router.replace({ path: '/login' });

  next();
});


router.afterEach((to,from) => {
  NProgress.done();
  NProgress.remove();
});


export default router;