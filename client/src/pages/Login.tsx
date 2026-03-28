import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";

export default function Login() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Brutalist Header */}
        <div className="brutalist-bracket mb-12">
          <h1 className="text-brutalist-h1 text-center mb-4">ANTIGRAVITY</h1>
          <p className="text-center text-brutalist-label text-gray-600 tracking-widest">CHAT PRIVADO</p>
        </div>

        {/* Login Card */}
        <div className="card-brutalist mb-8">
          <div className="mb-6">
            <p className="text-brutalist-body mb-4">
              Acesso restrito ao proprietário. Faça login com sua conta Manus para continuar.
            </p>
          </div>

          <a href={getLoginUrl()}>
            <Button
              className="btn-brutalist w-full text-lg font-black py-4"
              variant="default"
            >
              ENTRAR COM MANUS
            </Button>
          </a>
        </div>

        {/* Footer Info */}
        <div className="text-center text-sm text-gray-600">
          <p className="brutalist-underline pb-4 mb-4">
            Dashboard de Conversas com Agentes
          </p>
          <p>Gerenciamento privado de mensagens e notificações em tempo real</p>
        </div>
      </div>
    </div>
  );
}
