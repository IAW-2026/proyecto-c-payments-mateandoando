import { SignIn } from "@clerk/nextjs";

export default function PaginaLogin() {
  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <SignIn path="/login" routing="path" fallbackRedirectUrl="/dashboard" />
    </div>
  );
}