import Image from 'next/image';
import { cn } from '@/lib/utils';

type InterfaceOrnamentProps = {
  src: string;
  alt?: string;
  className?: string;
  priority?: boolean;
};

export function InterfaceOrnament({ src, alt = '', className, priority = false }: InterfaceOrnamentProps) {
  return (
    <div className={cn('pointer-events-none absolute select-none', className)}>
      <Image src={src} alt={alt} fill className="object-contain" priority={priority} />
    </div>
  );
}
