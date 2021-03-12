import Vue from 'vue'
import VueRouter from 'vue-router'
import Navigator from '@/views/Navigator'
import Startscreen from '@/views/Startscreen'
import Browser from '@/components/Browser'

Vue.use(VueRouter)

const routes = [
  {
    path: '/', // this is the default path (the route with the path "/") that is loaded on startup
    name: 'Startscreen',
    component: Startscreen
  },
  {
    path: '/Navigator',
    name: 'Navigator',
    component: Navigator,
    children: [
      {
        path: 'Browser', // setting the path to '' (path: '') this component will be handelt as default path
        component: Browser,
      },
    ]
  },
  // {
  //   path: '/about',
  //   name: 'About',
  //   // route level code-splitting
  //   // this generates a separate chunk (about.[hash].js) for this route
  //   // which is lazy-loaded when the route is visited.
  //   component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
  // }
]

const router = new VueRouter({
  routes
})

export default router
