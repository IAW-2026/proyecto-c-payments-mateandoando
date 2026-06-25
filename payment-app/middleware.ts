import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

//Definimos las rutas que no van a pedir inicio de sesión con Clerk
const isPublicRoute = createRouteMatcher([
  '/',             //Pagina principal, donde se muestran los productos y se conecta a MP
  '/success',      //Pago exitoso
  '/failure',      //Pago rechazado
  '/pending',      //Pago pendiente
  //Webhooks de Mercado Pago
  '/api/payments/transactions/(.*)/approved',
  '/api/payments/transactions/(.*)/rejected',
  //Comunicación interna con la Seller App y Buyer App, acá usan el X-API-Key
  '/api/payments/create',
  '/api/payments/transactions/(.*)/cancelled',
  '/api/payments/history/buyer/(.*)',
  '/api/payments/analytics',
  '/api/payments/transactions/(.*)'
]);

export default clerkMiddleware(async (auth, request) => {
  //Si la ruta no es pública, exigimos que el usuario esté autenticado
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    //Ignorar archivos estáticos y de Next.js
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    //Proteger siempre todas las rutas de la API
    '/(api|trpc)(.*)',
  ],
};