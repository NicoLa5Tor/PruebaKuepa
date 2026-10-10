/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from 'react';
import { createBrowserRouter } from "react-router-dom";
import NotFound from '@/pages/not-found/not-found';
import { Skeleton } from "./components/ui/skeleton";
import Leads from './pages/leads/leads';
import { AppLayout } from './components/layouts/app-layout';
import { RequireAuth } from './components/require-auth';
import Home from './pages/home/home';
import Settings from './pages/settings/settings';

const Login = lazy(() => import('@/pages/auth/login')); 
const Inscription = lazy(() => import('@/pages/inscription/inscription'));
const router = createBrowserRouter([
  {
    path: '/auth',
    element: 
    <Suspense fallback={<Loading mode="logo" />}>
      <Login />
    </Suspense>
  },
  {
    path: '/',
    element: 
    <Suspense fallback={<Loading mode="logo" />}>
      <Login />
    </Suspense>
  },
  {
    // Pública: formulario de inscripción para prospectos
    path: '/inscripcion',
    element: 
    <Suspense fallback={<Loading mode="logo" />}>
      <Inscription />
    </Suspense>
  },
  {
    path: '/leads',
    element: 
      <RequireAuth>
        <AppLayout module="crm" window="contact">
          <Suspense fallback={<Loading mode="logo" />}>
            <Leads />
          </Suspense>
        </AppLayout>
      </RequireAuth>
  },
  {
    path: '/home',
    element: 
      <RequireAuth>
        <AppLayout module="crm" window="contact">
          <Suspense fallback={<Loading mode="logo" />}>
            <Home />
          </Suspense>
        </AppLayout>
      </RequireAuth>
  },
  {
    path: '/settings',
    element: 
      <RequireAuth>
        <AppLayout module="crm" window="settings">
          <Suspense fallback={<Loading mode="logo" />}>
            <Settings />
          </Suspense>
        </AppLayout>
      </RequireAuth>
  },
  {
    path: "*",
    element: 
      // NotFound renderiza el AppLayout completo, así que también va protegido
      <RequireAuth>
        <NotFound />
      </RequireAuth>
  }
]);

window['router'] = router

 function Loading ({mode}:{mode?:string}) {
  if(!mode){
    return (
      <Skeleton className=" w-[92vw] lg:w-[72vw] mx-auto h-[88vh] md:h-[90vh] shadow-md rounded-lg scale-[0.99]" />
    )
  } else if (mode === 'logo'){
    return (
      <div className="flex w-[100vw] h-[100vh] items-center justify-center">
        <div className="z-20 flex items-center text-4xl bg-white w-fit px-4 py-2 rounded-md font-bold font-brand">
          <img src="/logo.jpeg" alt="logo" className="w-36 h-36 mr-2 animate-bounce" />
        </div>
      </div>
    )
  }
 }

export default router;