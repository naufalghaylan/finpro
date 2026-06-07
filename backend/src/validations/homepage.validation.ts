import { z } from 'zod';

export const getHomepageQuerySchema = z.object({
  lat: z.string().optional().refine(val => !val || !isNaN(Number(val)), { message: "Invalid latitude" }),
  lng: z.string().optional().refine(val => !val || !isNaN(Number(val)), { message: "Invalid longitude" })
});
