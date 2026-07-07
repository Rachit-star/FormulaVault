import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import VaultLayout from '@/components/vault/VaultLayout'

export default async function VaultPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: folders } = await supabase
    .from('folders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  return <VaultLayout user={user} folders={folders || []} />
}