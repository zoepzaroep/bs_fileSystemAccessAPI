import Vue from 'vue'
import VueRouter from 'vue-router'
import Navigator from '@/views/Navigator'
import Startscreen from '@/views/Startscreen'
import Home from '@/components/Home'
import Link1 from '@/components/Link1'
import Link2 from '@/components/Link2'
import Tree from '@/components/Tree'

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
        path: 'Home', // setting the path to '' (path: '') this component will be handelt as default path
        component: Home,
        children: [
          {
            path: 'Tree', // setting the path to '' (path: '') this component will be handelt as default path
            component: Tree
          }
        ]
      },
      {
        path: 'Link1',
        component: Link1
      },
      {
        path: 'Link2',
        component: Link2
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
