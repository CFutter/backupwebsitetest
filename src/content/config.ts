
import { defineCollection, z } from 'astro:content';

const pagesCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
  }),
});

export const collections = {
  pages: pagesCollection,
};
