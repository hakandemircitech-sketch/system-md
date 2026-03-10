import { redirect } from 'next/navigation'

interface LibraryBlueprintPageProps {
  params: Promise<{ id: string }>
}

export default async function LibraryBlueprintPage({ params }: LibraryBlueprintPageProps) {
  const { id } = await params
  redirect(`/generate/${id}`)
}
