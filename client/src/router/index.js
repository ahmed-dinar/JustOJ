import Vue from 'vue';
import Router from 'vue-router';
import NProgress from 'nprogress';

import Hello from '@/components/Hello';
import SignUp from '@/components/SignUp';
import Status from '@/components/Status';
import Problems from '@/components/Problems';
import Ranks from '@/components/Ranks';
import Login from '@/components/Login';
import Contests from '@/components/Contests';
import User from '@/components/User';
import Page404 from '@/components/Page404';
//import store from '@/store';

Vue.use(Router);

const router = new Router({

  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Hello
    },
    {
      path: '/login',
      name: 'Login',
      component: Login
    },
    {
      path: '/signup',
      name: 'SignUp',
      component: SignUp
    },
    {
      path: '/problems',
      name: 'Problems',
      component: Problems
    },
    {
      path: '/user',
      name: 'User',
      component: User
    },
    {
      path: '/status',
      name: 'Status',
      component: Status
    },
    {
      path: '/ranks',
      name: 'Ranks',
      component: Ranks
    },
    {
      path: '/contests',
      name: 'Contests',
      component: Contests
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