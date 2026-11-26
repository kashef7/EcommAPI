import { mountPage } from '@/app/mountPage';
import { ProfileView } from '@/features/profile';
import { SiteShell } from '@/layouts';

function ProfilePage() {
  return (
    <SiteShell activeNav="profile">
      <ProfileView />
    </SiteShell>
  );
}

mountPage(ProfilePage);
