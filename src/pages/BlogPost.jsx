import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import NavBar from '../components/marketing/Nav';
import { Image } from '@heroui/react';
import { mdxComponents } from '../utils/mdxComponents.jsx';
import Footer from '../components/marketing/Footer.jsx';

function BlogPost() {
    const { slug } = useParams(); // Get the "slug" from the URL
    const [PostContent, setPostContent] = useState(null);
    const [postMetadata, setPostMetadata] = useState(null);

    // Load the MDX content dynamically
    useEffect(() => {
        const loadPost = async () => {
            try {
                const post = await import(`../../blog/${slug}.mdx`);
                setPostContent(() => post.default);

                // exclude default and set everything else as metadata:
                // eslint-disable-next-line no-unused-vars
                const { default: _, ...meta } = post;
                setPostMetadata(meta);
            } catch (error) {
                console.error('Error loading the post:', error);
            }
        };

        loadPost();
    }, [slug]);

    // Check if PostContent is loaded before rendering
    if (!PostContent) {
        return <p>Loading...</p>;
    }

    return (
        <div className="w-screen min-h-screen bg-content1">
            <NavBar />
            <div className="w-full max-w-3xl mx-auto px-6 py-12 text-md sm:text-lg">
                <Image
                    width="100%"
                    alt="Cover"
                    className="object-cover w-full h-80 mb-9"
                    src={postMetadata.image || 'https://placehold.co/600x400?text=Cover'}
                />
                <PostContent components={mdxComponents} />
            </div>
            <Footer />
        </div>
    );
}

export default BlogPost;
