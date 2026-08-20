import { useEffect } from "react";

type PublicMetadata = {
  title: string;
  description: string;
  image?: string;
  type?: "website" | "article";
};

export function usePublicMetadata(metadata: PublicMetadata | null) {
  useEffect(() => {
    if (!metadata) return;
    const url = window.location.href.split("#")[0];
    document.title = `${metadata.title} · usloop.id`;
    setMeta("name", "description", metadata.description);
    setMeta("property", "og:title", metadata.title);
    setMeta("property", "og:description", metadata.description);
    setMeta("property", "og:type", metadata.type || "website");
    setMeta("property", "og:url", url);
    setMeta("name", "twitter:card", metadata.image ? "summary_large_image" : "summary");
    setMeta("name", "twitter:title", metadata.title);
    setMeta("name", "twitter:description", metadata.description);
    if (metadata.image) {
      setMeta("property", "og:image", metadata.image);
      setMeta("name", "twitter:image", metadata.image);
    } else {
      removeMeta("property", "og:image");
      removeMeta("name", "twitter:image");
    }
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    return () => {
      document.title = "usloop.id — Event & Community";
    };
  }, [metadata]);
}

function setMeta(attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(
    `meta[${attribute}="${key}"]`,
  );
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
}

function removeMeta(attribute: "name" | "property", key: string) {
  document.head.querySelector(`meta[${attribute}="${key}"]`)?.remove();
}
