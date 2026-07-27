// Cherche récursivement toutes les URLs http(s) dans un objet de réponse API,
// peu importe sa structure exacte (utile car ces APIs gratuites changent souvent de schéma).
function collectUrls(obj, out = []) {
    if (!obj) return out;
    if (typeof obj === 'string') {
        if (/^https?:\/\//i.test(obj)) out.push(obj);
        return out;
    }
    if (Array.isArray(obj)) {
        for (const item of obj) collectUrls(item, out);
        return out;
    }
    if (typeof obj === 'object') {
        for (const key of Object.keys(obj)) collectUrls(obj[key], out);
    }
    return out;
}

// Retourne l'URL la plus probable pour une vidéo/média téléchargeable,
// en excluant les vignettes/avatars et en préférant la HD si présente.
function pickBestMediaUrl(obj) {
    const urls = collectUrls(obj);
    if (urls.length === 0) return null;

    const isThumbnail = (u) => /thumb|avatar|cover|profile_pic|\.jpg(\?|$)|\.jpeg(\?|$)|\.png(\?|$)|\.webp(\?|$)/i.test(u);
    const isHd = (u) => /hd|high|1080|720/i.test(u);

    const nonThumb = urls.filter(u => !isThumbnail(u));
    const pool = nonThumb.length > 0 ? nonThumb : urls;

    const hd = pool.find(isHd);
    return hd || pool[0];
}

export { collectUrls, pickBestMediaUrl };
export default { collectUrls, pickBestMediaUrl };
