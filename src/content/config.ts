import { defineCollection, z } from 'astro:content';

export const collections = {
  pages: defineCollection({
    type: 'content',
    schema: z.object({
      title: z.string(),
      navLabel: z.string().optional(),   // <-- add this (optional)
      navOrder: z.number().optional(),
      icon: z.string().optional(),
      showInNav: z.boolean().default(true),
      template: z.enum(['default','project','dataset','newsItem']).optional().default('default'),
    }),
  }),
};