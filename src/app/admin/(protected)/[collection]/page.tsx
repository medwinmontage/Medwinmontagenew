import { notFound } from 'next/navigation';
import { COLLECTIONS, CollectionKey } from '@/lib/collections';
import CrudManager from '@/components/admin/CrudManager';

export default async function CollectionAdminPage(ctx: { params: Promise<{ collection: string }> }) {
  const params = await ctx.params;
  const key = params.collection as CollectionKey;
  const config = COLLECTIONS[key];
  if (!config) notFound();

  return <CrudManager collection={key} label={config.label} fields={config.fields} titleField={config.titleField} />;
}
