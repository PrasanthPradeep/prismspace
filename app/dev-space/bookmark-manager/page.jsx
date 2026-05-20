import BookmarkManager, { title } from '@/components/dev-tools/BookmarkManager';

export const metadata = {
  title,
};

export default function Page() {
  return <BookmarkManager />;
}
