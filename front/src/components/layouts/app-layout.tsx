// bg-purple-800 text-white bg-slate-800 bg-pink-800 bg-sky-800 bg-emerald-800 bg-lime-800 bg-green-800 bg-cyan-800 bg-blue-800 bg-rose-800 bg-indigo-800 bg-slate-800 hover:bg-purple-800 hover:text-white hover:bg-slate-800 hover:bg-pink-800 hover:bg-sky-800 hover:bg-emerald-800 hover:bg-lime-800 hover:bg-green-800 hover:bg-cyan-800 hover:bg-blue-800 hover:bg-rose-800 hover:bg-indigo-800 hover:bg-slate-800

import { ReactNode, useState } from 'react'
import { app, attendance, user } from '@/atoms/kuepa';
import { Toaster } from '@/components/ui/toaster';
import { AppSidebar } from '../app-sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '../ui/breadcrumb';
import { useStore } from '@nanostores/react';
import { Button } from '../ui/button';
import { TbArrowBack, TbLayoutSidebarRightFilled } from 'react-icons/tb';
import { Notifications } from '../notifications';
import { useSearchParams } from 'react-router-dom';
import { decodeBase64UrlSafe } from '@/util/utils';

export interface AppLayoutProps {
  children: ReactNode
  module?: string
  window?: string
}

export function AppLayout(props: AppLayoutProps) {
  const $app = useStore(app);

  const [open, setOpen] = useState<boolean>(false);

  const { children } = props;
  const $user = useStore(user);
  const $attendance = useStore(attendance)
  
  let [searchParams] = useSearchParams();

  return (
    // Alto exacto de la pantalla: la barra móvil y el encabezado ocupan su espacio
    // y el contenido llena el resto con su propio scroll; la página nunca se mueve
    <div className="flex flex-col w-screen h-[100dvh] overflow-hidden">
      <div className="flex w-full flex-1 min-h-0">
        <div className="flex flex-col w-full min-h-0">
          <div className="nav w-full flex md:hidden bg-slate-800  font-brand text-white py-2 px-4 text-xl items-center justify-between">
            
            <span className='flex'>Kuepa</span>
            <div className="flex justify-end">
            </div>
          </div>
          <SidebarProvider defaultOpen={$app?.sidebar} className="flex-1 min-h-0">
            <AppSidebar  className={`bg-${$app?.accent}-800 text-white transition-all ease-in-out`} />
            <SidebarInset className="min-h-0 overflow-hidden">
              <header className="flex z-50 backdrop-blur-sm bg-white/75 h-12 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                <div className="flex items-center gap-1 px-4">
                  <SidebarTrigger className="-ml-1" />
                  <Separator orientation="vertical" className="mr-2 h-4" />
                  {
                    $app?.back || searchParams.has('back')?
                      <>
                        <Button to={ searchParams.has('back') ? decodeBase64UrlSafe(searchParams.get('back')) : $app?.back } variant="ghost"  size="icon" className="flex h-7 w-7">
                          <TbArrowBack className="h-4 w-4" />
                          <span className="sr-only">Back</span>
                        </Button>
                        <Separator orientation="vertical" className="mr-2 h-4" />
                      </>
                    :
                      <>
                        <div className="flex h-7 w-7"></div>
                        <Separator orientation="vertical" className="mr-2 h-4" />
                      </>
                  }
                  
                  <Breadcrumb>
                    <BreadcrumbList>
                      {
                        $app?.breadcrumb?.map((_breadcrumb:any, index:number)=>{
                          return (
                            <div key={_breadcrumb.url} className='flex h-fit items-center mx-1'>
                              <BreadcrumbItem key={_breadcrumb._id} className={` ${index < $app?.breadcrumb?.length - 1? 'hidden md:block': 'block'} `}>
                                <BreadcrumbLink to={_breadcrumb.url}>
                                  {_breadcrumb.title}
                                </BreadcrumbLink>
                              </BreadcrumbItem>
                              {
                                index < $app?.breadcrumb?.length - 1 ?
                                  <BreadcrumbSeparator className='hidden md:block' />
                                : null
                              }
                            </div>
                          )
                        })
                      }
                    </BreadcrumbList>
                  </Breadcrumb>
                </div>
                <div className="flex grow justify-end items-center">
                  <Notifications />
                  <Separator orientation="vertical" className="mr-2 h-4" />

                  <Button to={ searchParams.has('back') ? decodeBase64UrlSafe(searchParams.get('back')) : $app?.back } variant="ghost"  size="icon" className="flex h-7 w-10 pe-3">
                    <TbLayoutSidebarRightFilled className="h-4 w-4" />
                    <span className="sr-only">Back</span>
                  </Button>
                </div>
              </header>
              <div className="flex-1 min-h-0 w-full md:max-w-screen-xl mx-auto p-1 md:p-0">
                <div className="h-full overflow-y-auto overflow-x-hidden w-full rounded-md p-1 pb-0 md:p-4">
                  {children}
                </div>
              </div>
            </SidebarInset>
          </SidebarProvider>
        </div>
      </div>
      <Toaster />
    </div>
  )
}