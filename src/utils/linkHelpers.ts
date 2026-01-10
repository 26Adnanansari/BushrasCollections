/**
 * Utility to safely handle CTA links that might be absolute URLs, 
 * relative paths, or even accidental text with a URL.
 */

/**
 * Extracts the likely intended URL from a string.
 * Courteously handles cases where users paste "Check out this product! https://..."
 */
export const parseCTALink = (link: string | null | undefined): string => {
    if (!link) return "/";

    const trimmedLink = link.trim();

    // If it's a simple path, return it
    if (trimmedLink.startsWith("/") || trimmedLink.startsWith("#")) {
        return trimmedLink;
    }

    // If it's a full URL, return it
    if (trimmedLink.startsWith("http://") || trimmedLink.startsWith("https://")) {
        return trimmedLink;
    }

    // If it's a sentence containing a URL, try to extract the URL part
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = trimmedLink.match(urlRegex);

    if (matches && matches.length > 0) {
        // Return the first URL found
        return matches[0];
    }

    // Fallback: If it looks like a path but lacks the leading slash
    if (trimmedLink.includes("/") && !trimmedLink.includes(" ")) {
        return `/${trimmedLink}`;
    }

    return trimmedLink;
};

/**
 * Executes a CTA click with smart routing
 */
export const handleCTANavigation = (
    link: string | null | undefined,
    navigate: (path: string) => void
) => {
    const finalLink = parseCTALink(link);

    if (finalLink.startsWith("http")) {
        window.location.href = finalLink;
    } else {
        navigate(finalLink);
    }
};
