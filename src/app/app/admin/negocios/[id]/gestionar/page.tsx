import { redirect } from "next/navigation"

/**
 * Esta página ya no existe: lo que hacía —editar los datos, saltar a galería,
 * horarios y promociones, y eliminar el negocio— vive ahora en la ficha, que
 * es una sola.
 *
 * Queda el redirect y no un borrado seco porque la URL está repartida por
 * ahí: el panel de invitaciones enlazaba aquí, y cualquier admin puede
 * tenerla en un marcador o en un correo viejo. Un 404 no le diría a dónde ir.
 */
export default async function GestionarRedirect({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/app/admin/negocios/${id}`)
}
