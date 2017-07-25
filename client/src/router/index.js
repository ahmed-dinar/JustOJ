import Vue from 'vue';
import Router from 'vue-router';
import NProgress from 'nprogress';

import Hello from '@/components/Hello';
import SignUp from '@/components/SignUp';
import Status from '@/components/Status';
import Ranks from '@/components/Ranks';
import Login from '@/components/Login';
import Contests from '@/components/Contests';

import User from '@/components/user/User';
import Account from '@/components/user/Account';
import ForgotPassword from '@/components/user/ForgotPassword';
import VerifyAccount from '@/components/user/VerifyAccount';

import Problems from '@/components/problem/Problems';
import ProblemList from '@/components/problem/ProblemList';

import Page404 from '@/components/Page404';
import store from '@/store';

Vue.use(Router);

const router = new Router({

  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Hello,
      meta: { title: 'Home' }
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
      meta: { title: 'Login' }
    },
    {
      path: '/signup',
      name: 'SignUp',
      component: SignUp,
      meta: { title: 'Sign Up' }
    },
    {
      path: '/problems',
      component: Problems,
      children: [
        {
          path: '',
          name: 'ProblemList',
          component: ProblemList,
          meta: { title: 'Problem List' }
        }
      ]
    },
    {
      path: '/account',
      component: User,
      children: [
        {
          path: '',
          name: 'user-account',
          component: Account,
          meta: { title: 'Account' }
        },
        {
          path: 'password/reset',
          name: 'user-forgot-password',
          component: ForgotPassword,
          meta: { title: 'Reset Password' }
        },
        {
          path: 'verify',
          name: 'VerifyAccount',
          component: VerifyAccount,
          meta: { title: 'Verify Account' }
        }
      ]
    },
    {
      path: '/status',
      name: 'Status',
      component: Status,
      meta: { title: 'Status' }
    },
    {
      path: '/ranks',
      name: 'Ranks',
      component: Ranks,
      meta: { title: 'Ranks' }
    },
    {
      path: '/contests',
      name: 'Contests',
      component: Contests
    },
    {
      path: '*',
      component: Page404,
      meta: { title: '404' }
    }
  ]
});


router.beforeEach((to, from, next) => {

  document.title = to.meta.title;
  NProgress.start();

  if( (to.name === 'login' || to.name === 'SingUp') && store.getters.isLoggedIn )
    router.replace({ path: '/' });

  // if( to.matched.some(record => record.meta.auth) && !store.getters.isLoggedIn )
  //   router.replace({ path: '/login' });

  next();
});


router.afterEach((to,from) => {
  NProgress.done();
  NProgress.remove();
});


export default router;