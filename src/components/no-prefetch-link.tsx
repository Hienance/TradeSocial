import Link, { LinkProps } from "next/link";
import { ReactNode } from "react";

export type NoPrefetchLinkProps = LinkProps & {
  children: ReactNode;
  className?: string;
};

export default function NoPrefetchLink({ children, className, ...rest }: NoPrefetchLinkProps) {
  return (
    <Link prefetch={false} className={className} {...rest}>
      {children}
    </Link>
  );
}
