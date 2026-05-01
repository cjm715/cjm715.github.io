import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    category: z.string(),
    excerpt: z.string(),
    thumbnail: z.string(),
    thumbnailAlt: z.string(),
    thumbnailPosition: z.string().optional(),
    thumbnailGif: z.string().optional(),
  }),
});

export const collections = { posts };
