import Image from 'next/image';
import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Image
          className={styles.logo}
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <h1
          style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}
        >
          Welcome to Cheerio
        </h1>
        <p style={{ color: '#666', marginBottom: '2rem', textAlign: 'center' }}>
          A modern web app with authentication powered by Supabase
        </p>

        <div className={styles.ctas}>
          <Link className={styles.primary} href="/register">
            Get Started
          </Link>
          <Link href="/sign-in" className={styles.secondary}>
            Sign In
          </Link>
        </div>

        <div style={{ marginTop: '3rem', textAlign: 'center' }}>
          <p
            style={{
              fontSize: '0.875rem',
              color: '#999',
              marginBottom: '0.5rem',
            }}
          >
            Already set up?
          </p>
          <Link
            href="/dashboard"
            style={{
              color: '#0070f3',
              textDecoration: 'none',
              fontSize: '0.875rem',
            }}
          >
            Go to Dashboard →
          </Link>
        </div>
      </main>
      <footer className={styles.footer}>
        <a
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
