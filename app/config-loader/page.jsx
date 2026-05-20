import ConfigLoader, { title } from '@/components/config/ConfigLoader';

export const metadata = {
  title,
};

export default function Page() {
  return <ConfigLoader />;
}
