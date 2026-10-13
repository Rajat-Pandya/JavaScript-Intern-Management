// api.js — all network access lives here. UI code never calls fetch() directly.

const QUOTE_URL = "https://dummyjson.com/quotes/random";

// A reusable, safer wrapper around fetch(): timeout + status check + friendly errors.
export async function fetchJSON(url, { timeoutMs = 8000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs); // cancel if it takes too long

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`The server responded with status ${response.status}.`);
    }
    return await response.json();
  } catch (error) {
    if (error.name === "AbortError")
      throw new Error("The request timed out. Please try again.");
    if (error instanceof SyntaxError)
      throw new Error("The server sent data in an unexpected format.");
    if (error instanceof TypeError)
      throw new Error("Network error. Check your internet connection.");
    throw error; // our own Error from above
  } finally {
    clearTimeout(timer); // always stop the timer
  }
}

// Returns { text, author } or throws an Error with a user-friendly message.
export async function getRandomQuote() {
  const data = await fetchJSON(QUOTE_URL);

  // Never trust data from outside: check its shape before using it.
  if (typeof data?.quote !== "string" || typeof data?.author !== "string") {
    throw new Error("The quote service returned unexpected data.");
  }
  return { text: data.quote, author: data.author };
}
