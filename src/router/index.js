import Vue from 'vue'
import VueRouter from 'vue-router'
import NavWrapper from '@/views/Navigator'
import Startscreen from '@/views/Startscreen'
import Home from '@/components/Home'
import Link1 from '@/components/Link1'
import Link2 from '@/components/Link2'

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
    component: NavWrapper,
    children: [
      {
        path: '',
        component: Home
      },
      {
        path: 'link1',
        component: Link1
      },
      {
        path: 'link2',
        component: Link2
      }
    ]
  }
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
