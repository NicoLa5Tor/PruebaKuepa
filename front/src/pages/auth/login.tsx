// bg-orange-400 bg-red-500 hover:text-orange-400 hover:text-red-500 bg-orange-500 hover:text-orange-500

import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { useStore } from "@nanostores/react"
import { access,  token, user } from "@/atoms/kuepa"
import { AuthService } from "@/services/authService"
import { FormEvent, useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { hasSession } from "@/util/session"
import { SocialLogin } from "@/components/auth/social-login"



function Login () {

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const location = useNavigate();
  // Ruta protegida a la que se intentó entrar antes de pedir login
  const from = (useLocation().state as { from?: string } | null)?.from || '/home'

  const [loading, setLoading] = useState(false)

  const $token = useStore(token);
  const $access = useStore(access);
  const $user = useStore(user);

  const { _token } = useParams();
  const [error, setError] = useState<any>(null)

  const init = async ()=>{
    const response = await authService.token({token:_token ||''}, 'kuepa')
    if(response.token){
      token.set(response.token)
      user.set(response.user)
      if(response.home){
        const can = response.user.homes.find(_h=> _h.app === 'kuepa')?.can
        access.set({
          can: can,
          home: response.home
        })
        setError(null)
        location(`/home`)
      } else {
        setError('Usuario o contraseña incorrectos')
      }
    }
  }


  useEffect(()=>{
    if(_token){
      init()
    }
    if(hasSession() && access.get()){
      setTimeout(()=>{
        location(from)
      },1000)
    } 
  },[_token, $token])

  const authService = new AuthService('/auth')

  const handleLogin = async (e: FormEvent) => {
    setLoading(true)
    
    setError(null)
    e.preventDefault()
    const response = await authService.login({username, password}, 'kuepa')
    if(response.token){
      authService.startSession(response)
      location(from)
    } else {
      setError('Usuario o contraseña incorrectos')
    }
    setLoading(false)
  }


  return (
    <>
      {
        $token && $access && $user && hasSession() ? 
          <div className="flex w-[100vw] h-[100vh] items-center justify-center">
            <div className="z-20 flex items-center text-4xl bg-white w-fit px-4 py-2 rounded-md font-bold">
              <img src="/logo.jpeg" alt="logo" className="w-36 h-36 mr-2 animate-bounce" />
            </div>
          </div>
        : 
          <div className="container relative flex h-[100dvh] overflow-hidden flex-col items-center w-full justify-center md:grid md:max-w-none md:grid-cols-2 md:px-0">
            <div className="relative hidden h-full flex-col bg-muted p-10 text-white md:flex">
              <div className="absolute inset-0 bg-orange-900" />
              <Link to='/' className="relative z-20 flex items-center text-4xl bg-white w-fit px-4 py-2 rounded-md font-bold">
                <img src="/logo.jpeg" alt="logo" className="w-36 h-36 mr-2" />
              </Link>
            </div>
            {/* Solo esta columna hace scroll si la pantalla es muy baja: la página nunca se mueve */}
            <div className="flex h-full w-full overflow-y-auto py-6 lg:p-8">
              <div className="m-auto flex w-full flex-col justify-center sm:w-[350px]">
                <div className="flex md:hidden w-full justify-center">
                  <Link to='/' className="flex mb-4 text-[4rem] font-bold">
                    <img src="/logo.jpeg" alt="logo" className="w-32 h-32 mr-2" />
                  </Link>
                </div>
                <span className="flex text-[3.5rem] mb-8 w-full justify-center items-center font-extrabold bg-gradient-to-r from-orange-400  via-orange-600 to-orange-400 text-transparent bg-clip-text animate-gradient">kuepa</span>
                <form className="flex flex-col" onSubmit={(e)=>{handleLogin(e)}}>
                  {
                    error ? 
                      <Alert variant="destructive" className="mb-3">
                        <AlertTitle className="group-hover:text-red-700">Error login</AlertTitle>
                        <AlertDescription>
                          {error}
                        </AlertDescription>
                      </Alert>
                    : null
                  }
                  <div className="flex mb-3 justify-center">
                    <label className="flex flex-col font-title text-orange-900 font-medium" htmlFor="username">Usuario:
                      <input value={username} autoFocus onChange={(e)=>{setUsername(e.target.value)}} id="username" type="text" name="username" required className="flex border border-solid border-orange-100 transition-all focus:border-orange-200 focus:shadow-md bg-orange-100 outline-none px-2 py-1 w-56 rounded-xl" />
                    </label>
                  </div>
                  <div className="flex mb-6 justify-center">
                    <label className="flex flex-col font-title text-orange-900 font-medium" htmlFor="password">Contraseña:
                      <input value={password} onChange={(e)=>{setPassword(e.target.value)}} id="password"  minLength={6} type="password" name="password" required className="flex border border-solid border-orange-100 transition-all focus:border-orange-200 focus:shadow-md bg-orange-100 outline-none px-2 py-1 w-56 rounded-xl" />
                    </label>
                  </div>
                  <div className="flex flex-col justify-center items-center content-center mb-3">
                    <button disabled={loading} data-onclick="login" className={`to-send disabled:animate-pulse transition-all leading-none flex font-title justify-center text-white bg-${error ? 'red' : 'orange'}-500 text-lg mx-2 cursor-pointer hover:bg-white w-32 content-center  px-2 pt-2 pb-2 rounded-full shadow-md hover:text-${error ? 'red': 'orange'}-500`}>Conectarme</button>
                  </div>
                </form>
                <SocialLogin onSuccess={() => location(from)} />
              </div>
            </div>
          </div>
      }
  </>
  )
}
export default Login