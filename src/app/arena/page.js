import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ArenaLayout from '@/components/arena/ArenaLayout'

export default async function ArenaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: folders } = await supabase
    .from('folders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  const { data: formulas } = await supabase
    .from('formulas')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  return (
    <ArenaLayout
      user={user}
      folders={folders || []}
      formulas={formulas || []}
    />
  )
}
