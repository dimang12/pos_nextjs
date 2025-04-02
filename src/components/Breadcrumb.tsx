'use client';

import { Breadcrumbs, Link, Typography } from '@mui/material';
import { usePathname } from 'next/navigation';
import NextLink from 'next/link';

export default function Breadcrumb() {
  const pathname = usePathname();
  const paths = pathname.split('/').filter(Boolean);

  return (
    <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
      <Link
        component={NextLink}
        href="/"
        underline="hover"
        color="inherit"
      >
        Home
      </Link>
      {paths.map((path, index) => {
        const href = `/${paths.slice(0, index + 1).join('/')}`;
        const isLast = index === paths.length - 1;
        const label = path.charAt(0).toUpperCase() + path.slice(1);

        return isLast ? (
          <Typography key={path} color="text.primary">
            {label}
          </Typography>
        ) : (
          <Link
            key={path}
            component={NextLink}
            href={href}
            underline="hover"
            color="inherit"
          >
            {label}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
} 