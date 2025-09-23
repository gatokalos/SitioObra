import { supabase } from "../lib/customSupabaseClient.js";

export async function getInstagramPostsFromBucket() {
  const bucketName = "galeria de gatoencerrado";

  try {
    const { data, error } = await supabase.storage.from(bucketName).list("", {
      limit: 100,
      offset: 0,
      sortBy: { column: "name", order: "desc" },
    });

    if (error) {
      console.error("Error al listar imágenes:", error.message);
      return [];
    }

    const images = data
      .filter((file) => file.name.match(/\.(jpg|jpeg|png|webp)$/i))
      .map((file) => {
        const publicUrl = supabase.storage.from(bucketName).getPublicUrl(file.name).data.publicUrl;

        return {
          id: file.id || file.name,
          imgSrc: publicUrl,
          alt: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "), // alt basado en filename
          postUrl: publicUrl, // o deja null si no necesitas que se abra al clic
        };
      });

    return images;
  } catch (err) {
    console.error("Excepción al obtener imágenes del bucket:", err);
    return [];
  }
}
