import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer
      className="mt-auto border-t border-[var(--border-color)] bg-white py-4 px-4 text-center text-xs text-[var(--text-muted)]"
      style={{ borderColor: '#E2E8F0' }}
    >
      <p className="leading-relaxed">
        Built by{' '}
        <span className="font-medium text-[var(--text-secondary)]">Priyank Mohan</span>
        {' · '}
        <Link
          href="https://www.linkedin.com/in/priyankmohan/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[var(--intuit-blue)] hover:underline"
        >
          LinkedIn
        </Link>
        {' · '}
        <Link
          href="https://github.com/priyankmg"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[var(--intuit-blue)] hover:underline"
        >
          GitHub
        </Link>
      </p>
      <p className="mt-1.5 text-[var(--text-muted)]">
        MIT License © 2026
      </p>
    </footer>
  );
}
