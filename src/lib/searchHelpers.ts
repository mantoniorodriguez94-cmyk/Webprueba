/**
 * Normaliza texto para búsqueda flexible
 * - Elimina acentos
 * - Convierte a minúsculas
 * - Elimina espacios extra
 */
export function normalizeText(text: string): string {
  if (!text) return "";
  
  return text
    .toLowerCase()
    .normalize("NFD") // Descompone caracteres con acentos
    .replace(/[\u0300-\u036f]/g, "") // Elimina los acentos
    .trim()
    .replace(/\s+/g, " "); // Normaliza espacios
}

/**
 * Verifica si un texto contiene otro (búsqueda flexible)
 * Insensible a mayúsculas, acentos y espacios extra
 */
export function containsText(haystack: string, needle: string): boolean {
  if (!needle) return true;
  if (!haystack) return false;
  
  const normalizedHaystack = normalizeText(haystack);
  const normalizedNeedle = normalizeText(needle);
  
  return normalizedHaystack.includes(normalizedNeedle);
}

/**
 * Calcula la similitud entre dos textos (0-1)
 * Útil para ordenar resultados por relevancia
 */
export function calculateSimilarity(text1: string, text2: string): number {
  const normalized1 = normalizeText(text1);
  const normalized2 = normalizeText(text2);
  
  if (normalized1 === normalized2) return 1;
  if (!normalized1 || !normalized2) return 0;
  
  // Algoritmo simple de similitud basado en palabras comunes
  const words1 = normalized1.split(" ");
  const words2 = normalized2.split(" ");
  
  let matches = 0;
  for (const word of words2) {
    if (words1.some(w => w.includes(word) || word.includes(w))) {
      matches++;
    }
  }
  
  return matches / words2.length;
}

/**
 * Filtra y ordena resultados por relevancia
 */
export function searchAndSort<T>(
  items: T[],
  searchTerm: string,
  getSearchableText: (item: T) => string[]
): T[] {
  if (!searchTerm) return items;
  
  // Filtrar y calcular relevancia
  const itemsWithScore = items
    .map(item => {
      const searchableTexts = getSearchableText(item);
      const maxSimilarity = Math.max(
        ...searchableTexts.map(text => 
          containsText(text, searchTerm) 
            ? calculateSimilarity(text, searchTerm) 
            : 0
        )
      );
      
      return {
        item,
        score: maxSimilarity
      };
    })
    .filter(({ score }) => score > 0); // Solo incluir items con alguna coincidencia
  
  // Ordenar por relevancia
  itemsWithScore.sort((a, b) => b.score - a.score);
  
  return itemsWithScore.map(({ item }) => item);
}

