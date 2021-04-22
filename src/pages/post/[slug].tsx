import { GetStaticPaths, GetStaticProps } from 'next';
import Prismic from '@prismicio/client';

import { useRouter } from 'next/router';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import { RichText } from 'prismic-dom';

import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

// import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  // const totalWordsPost = post.data.content.reduce((acc, item) => {
  //   const wordsHeading = String(item.heading).split(' ');
  //   const wordsBody = RichText.asText(item.body).split(' ');

  //   const wordsHeadingAcc = String(acc.heading).split(' ');
  //   const wordsBodyAcc = RichText.asText(acc.body).split(' ');

  //   const total =
  //     wordsHeading.length +
  //     wordsBody.length +
  //     wordsHeadingAcc.length +
  //     wordsBodyAcc.length;

  //   return total;
  // });

  const totalWordsPost = post.data.content.reduce((acc, item) => {
    const wordsHeading = String(item.heading).split(' ');
    const wordsBody = RichText.asText(item.body).split(' ');

    const wordsHeadingAcc = String(acc.heading).split(' ');
    const wordsBodyAcc = RichText.asText(acc.body).split(' ');

    const total =
      wordsHeading.length +
      wordsBody.length +
      wordsHeadingAcc.length +
      wordsBodyAcc.length;

    return total;
  });

  const timeReading = Math.ceil(Number(totalWordsPost) / 200);

  const allPosts = {
    first_publication_date: post.first_publication_date,
    timeReading,
    data: {
      title: post.data.title,
      banner: {
        url: post.data.banner.url,
      },
      author: post.data.author,
      content: post.data.content.map(content => {
        return {
          heading: content.heading,
          body: content.body.map(body => {
            return {
              text: body.text,
            };
          }),
        };
      }),
    },
  };

  return (
    <>
      <Header />

      <div className={styles.container}>
        <img src={allPosts.data.banner.url} alt={allPosts.data.title} />

        <div className={styles.content}>
          <header>
            <h1>{allPosts.data.title}</h1>
            <div>
              <span>
                <FiCalendar />
                <p>
                  {format(
                    new Date(allPosts.first_publication_date),
                    'dd MMM y',
                    {
                      locale: ptBR,
                    }
                  )}
                </p>
              </span>

              <span>
                <FiUser />
                <p>{allPosts.data.author}</p>
              </span>

              <span>
                <FiClock />
                <p>{timeReading} min</p>
              </span>
            </div>
          </header>

          <section>
            {allPosts.data.content.map(item => (
              <div key={item.heading}>
                <h1>{item.heading}</h1>

                {item.body.map(body => (
                  <p key={body.text}>{body.text}</p>
                ))}
              </div>
            ))}
          </section>
        </div>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.uid'],
      pageSize: 20,
    }
  );

  const allSlugsFormated = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths: allSlugsFormated,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const response = await prismic.getByUID(
    'posts',
    String(context.params.slug),
    {}
  );

  // const totalWordsPost = response.data.content.reduce((acc, item) => {
  //   const wordsHeading = String(item.heading).split(' ');
  //   const wordsBody = RichText.asText(item.body).split(' ');

  //   const wordsHeadingAcc = String(acc.heading).split(' ');
  //   const wordsBodyAcc = RichText.asText(acc.body).split(' ');

  //   return (
  //     wordsHeading.length +
  //     wordsBody.length +
  //     wordsHeadingAcc.length +
  //     wordsBodyAcc.length
  //   );
  // });

  // const timeReading = Math.ceil(totalWordsPost / 200);

  // const post = {
  //   first_publication_date: response.first_publication_date,
  //   timeReading,
  //   data: {
  //     title: response.data.title,
  //     banner: {
  //       url: response.data.banner.url,
  //     },
  //     author: response.data.author,
  //     content: response.data.content.map(content => {
  //       return {
  //         heading: content.heading,
  //         body: content.body.map(body => {
  //           return {
  //             text: body.text,
  //           };
  //         }),
  //       };
  //     }),
  //   },
  // };

  const post = {
    first_publication_date: response.first_publication_date,
    uid: response.uid,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content,
    },
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 60 * 24, // 24 hours
  };
};
