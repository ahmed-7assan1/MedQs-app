
/**
 * Utility to search for medical images using the NLM Open-i API.
 * Open-i is a service from the National Library of Medicine that provides access to millions of biomedical images.
 */
export async function searchOpenIMedicalImage(query: string): Promise<string | null> {
  try {
    // Clean query: remove punctuation and focus on keywords
    const keywords = query
      .replace(/[^\w\s]/gi, '')
      .split(' ')
      .slice(0, 10)
      .join(' ');

    const url = `https://openi.nlm.nih.gov/retrieve?query=${encodeURIComponent(keywords)}&n=1&m=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    
    const data = await res.json();
    if (data.list && data.list.length > 0) {
      // Return the large image URL if available
      return data.list[0].imgLarge || data.list[0].imgThumb || null;
    }
  } catch (error) {
    console.error("Open-i image search failed:", error);
  }
  return null;
}
