import Vue from 'vue';
import Router from 'vue-router';

import authRole from '@/lib/authRole';

import Hello from '@/components/Hello';
import SignUp from '@/components/SignUp';
import Status from '@/components/Status';
import Ranks from '@/components/Ranks';
import Login from '@/components/Login';

import Account from '@/components/user/Account';
import ForgotPassword from '@/components/user/ForgotPassword';
import VerifyAccount from '@/components/user/VerifyAccount';

import Announcement from '@/components/contest/Announcement';
import Dashboard from '@/components/contest/Dashboard';
import ContestSub from '@/components/contest/ContestSub';
import Standings from '@/components/contest/Standings';
import ContestProblem from '@/components/contest/ContestProblem';
import Clarifications from '@/components/contest/Clarifications';
import ClarRequest from '@/components/contest/ClarRequest';
import ClarView from '@/components/contest/ClarView';

import Contests from '@/components/contest/Contests';
import EditCRoute from '@/components/contest/edit/Route';
import ContestAdmin from '@/components/contest/edit/Admin';
import CreateContest from '@/components/contest/edit/CreateContest';
import EditContest from '@/components/contest/edit/EditContest';
import EditContestant from '@/components/contest/edit/Contestants';
import EditCProblem from '@/components/contest/edit/Problems';

import ProblemList from '@/components/problem/ProblemList';
import CreateProblem from '@/components/problem/Create';
import ViewProblem from '@/components/problem/View';
import ViewTestCase from '@/components/problem/ViewTestCase';
import Submissions from '@/components/Submissions';
import EditProblem from '@/components/problem/Edit/Statement';
import EditProblemCases from '@/components/problem/Edit/TestCase';
import EditProblemLimits from '@/components/problem/Edit/Limits';

import Page404 from '@/components/Page404';
import Page403 from '@/components/Page403';
import store from '@/store';

Vue.use(Router);

function routeTemplate (name) {
  return {
    name: name,
    template: `
      <div>
        <router-view></router-view>
      </div>
    `
  };
}


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
      path: '/submissions',
      name: 'Submissions',
      component: Submissions,
      meta: { title: 'Submissions' }
    },
    {
      path: '/problems',
      component: routeTemplate('ProblemRoute'),
      children: [
        {
          path: '',
          name: 'ProblemList',
          component: ProblemList,
          meta: { title: 'Problem List' }
        },
        {
          path: 'create',
          name: 'CreateProblem',
          component: CreateProblem,
          meta: { title: 'Create Problem', auth: true }
        },
        {
          path: 'testcase/:pid/:caseId',
          name: 'ViewTestCase',
          component: ViewTestCase,
          meta: { title: 'Test Case | View' }
        },
        {
          path: ':pid',
          component: routeTemplate('ProblemContentRoute'),
          children: [
            {
              path: 'edit/statement',
              name: 'EditProblem',
              component: EditProblem,
              meta: { title: 'Edit Problem' }
            },
            {
              path: 'edit/testcase',
              name: 'EditProblemCases',
              component: EditProblemCases,
              meta: { title: 'Edit Problem | Test Cases' }
            },
            {
              path: 'edit/limits',
              name: 'EditProblemLimits',
              component: EditProblemLimits,
              meta: { title: 'Edit Problem | Set Limits' }
            },
            {
              path: ':slug',
              name: 'ViewProblem',
              component: ViewProblem,
              meta: { title: 'Problems | View' }
            }
          ]
        }
        // {
        //   path: 'edit/testcase/:pid/:slug',
        //   name: 'EditProblemCases',
        //   component: EditProblemCases,
        //   meta: { title: 'Edit Problem | Test Cases' }
        // }
      ]
    },
    {
      path: '/account',
      component: routeTemplate('UserRoute'),
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
      component: routeTemplate('ContestRoute'),
      children: [
        {
          path: '',
          name: 'Contests',
          component: Contests,
          meta: { title: 'Contests' }
        },
        {
          path: 'create',
          name: 'CreateContest',
          component: CreateContest,
          meta: { title: 'Contests | Create', auth: true, role: 'admin' }
        },
        {
          path: 'admin',
          name: 'ContestAdmin',
          component: ContestAdmin,
          meta: { title: 'Contests | Admin', auth: true, role: 'admin' }
        },
        {
          path: ':cid',
          component: routeTemplate('contestIdRoute'),
          children: [
            {
              path: 'edit',
              component: EditCRoute,
              children: [
                {
                  path: '',
                  name: 'EditContest',
                  component: EditContest,
                  meta: { title: 'Edit Contest', auth: true, role: 'admin' }
                },
                {
                  path: 'problems',
                  name: 'EditContestProblems',
                  component: EditCProblem,
                  meta: { title: 'Edit Contest | Problem', auth: true, role: 'admin' }
                },
                {
                  path: 'contestants',
                  name: 'EditContestants',
                  component: EditContestant,
                  meta: { title: 'Edit Contest | Contestants', auth: true, role: 'admin' }
                }
              ]
            },
            {
              path: ':slug',
              component: routeTemplate('ContestArena'),
              children: [
                {
                  path: '',
                  name: 'Announcement',
                  component: Announcement,
                  meta: { title: 'Edit Contest | Contestants' }
                },
                {
                  path: 'dashboard',
                  name: 'Dashboard',
                  component: Dashboard,
                  meta: { title: 'Edit Contest | Contestants' }
                },
                {
                  path: 'submissions',
                  name: 'ContestSub',
                  component: ContestSub,
                  meta: { title: 'Edit Contest | Contestants' }
                },
                {
                  path: 'standings',
                  name: 'Standings',
                  component: Standings,
                  meta: { title: 'Edit Contest | Contestants' }
                },
                {
                  path: 'p/:pid/:pslug',
                  name: 'ContestProblem',
                  component: ContestProblem,
                  meta: { title: 'Edit Contest | Contestants' }
                },
                {
                  path: 'clar',
                  component: routeTemplate('ClarificationsRoute'),
                  children: [
                    {
                      path: '',
                      name: 'Clarifications',
                      component: Clarifications,
                      meta: { title: 'Edit Contest | Contestants' }
                    },
                    {
                      path: 'request',
                      name: 'ClarRequest',
                      component: ClarRequest,
                      meta: { title: 'Edit Contest | Contestants' }
                    },
                    {
                      path: ':clarid',
                      name: 'ClarView',
                      component: ClarView,
                      meta: { title: 'Edit Contest | Contestants' }
                    }
                  ]
                },

              ]
            }
          ]
        }
      ]
    },
    {
      path: '/404',
      name: '404',
      component: Page404,
      meta: { title: '404 | Not Found' }
    },
    {
      path: '/403',
      name: '403',
      component: Page403,
      meta: { title: '403 | Access Denied' }
    },
    {
      path: '*',
      name: 'Not Found',
      component: Page404,
      meta: { title: '404 | Not Found' }
    }
  ]
});


router.beforeEach((to, from, next) => {

  document.title = to.meta.title;
  progressbar.start();

  if( (to.name === 'login' || to.name === 'SingUp') && store.getters.isLoggedIn ){
    router.replace({ path: '/' });
    return next();
  }

  //checking if user loggedin and check role
  if (to.matched.some(record => record.meta.auth) && !store.getters.isLoggedIn ) {
    router.replace({
      path: '/login',
      query: {
        next: to.fullPath
      }
    });
    return next();
  }


  if( !to.matched.some(record => record.meta.role) ){
    return next();
  }


  //just check the localstorage insted of calling api everytime?
  authRole(to.meta.role)
    .then(response => {
      return next();
    })
    .catch(error => {
      router.replace({ path: '/403' });
      return next();
    });
});


router.afterEach((to,from) => {
  progressbar.done();
  progressbar.remove();
});


export default router;