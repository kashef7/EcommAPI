import { mountPage } from '@/app/mountPage';
import { SignupView } from '@/features/auth';
import { SiteShell } from '@/layouts';

function SignupPage() {
  return (
    <SiteShell activeNav="signup">
      <SignupView />
    </SiteShell>
  );
}

mountPage(SignupPage);
