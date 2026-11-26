import { mountPage } from '@/app/mountPage';
import { LoginView } from '@/features/auth';
import { SiteShell } from '@/layouts';

function LoginPage() {
  return (
    <SiteShell activeNav="login">
      <LoginView />
    </SiteShell>
  );
}

mountPage(LoginPage);
