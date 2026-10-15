import Image from "next/image";
import { isOptimizableImage } from "@/lib/blog";

export default function BlogCover({
  src,
  alt,
  sizes,
  priority = false,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
}) {
  if (isOptimizableImage(src))
    return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />;
  // A host next/image doesn't allow-list; render it as-is rather than crash the page.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading={priority ? "eager" : "lazy"} className="absolute inset-0 h-full w-full object-cover" />;
}
