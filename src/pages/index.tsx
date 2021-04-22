import { GetStaticProps } from 'next';
import { useState } from 'react';

import { FiCalendar, FiUser } from 'react-icons/fi';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import Link from 'next/link';

import Prismic from '@prismicio/client';
import Header from '../components/Header';

import { getPrismicClient } from '../services/prismic';

// import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState(postsPagination);

  async function handleLoadMorePages(): Promise<void> {
    await fetch(`${postsPagination.next_page}`)
      .then(response => response.json())
      .then(data => {
        const postsContent = data.results.map((post: Post) => {
          return {
            uid: post.uid,
            first_publication_date: post.first_publication_date,
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            },
          };
        });

        const nextPage = data.next_page;

        setPosts({
          next_page: nextPage,
          results: [...posts.results, ...postsContent],
        });
      });
  }

  return (
    <>
      <Header />

      <div className={styles.container}>
        <div className={styles.content}>
          {posts.results.map(post => (
            <div className={styles.post} key={post.uid}>
              <Link href={`/post/${post.uid}`}>
                <a>
                  <h1>{post.data.title}</h1>
                </a>
              </Link>
              <p>{post.data.subtitle}</p>
              <section>
                <span>
                  <FiCalendar />
                  <div>
                    {format(new Date(post.first_publication_date), 'dd MMM y', {
                      locale: ptBR,
                    })}
                  </div>
                </span>
                <span>
                  <FiUser />
                  <div>{post.data.author}</div>
                </span>
              </section>
            </div>
          ))}

          {posts.next_page ? (
            <button
              className={styles.button}
              type="button"
              onClick={handleLoadMorePages}
            >
              Carregar mais posts
            </button>
          ) : (
            <p className={`${styles.button} ${styles.endText}`}>
              Isso é tudo que temos por hoje ;)
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 2,
    }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  const nextPage = postsResponse.next_page;

  const postsPagination = {
    next_page: nextPage,
    results: posts,
  };

  return {
    props: { postsPagination },
    revalidate: 60 * 60 * 24, // 24 hours
  };
};
