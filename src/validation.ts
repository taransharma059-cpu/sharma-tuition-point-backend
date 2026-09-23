import { z } from 'zod';

export const enquirySchema = z.object({
  name: z.string().trim().min(2, 'Please enter your full name.').max(80),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number.'),
  classInterestedIn: z.string().trim().min(1, 'Please select a class or subject.').max(100),
  message: z.string().trim().max(500, 'Message must be 500 characters or less.').default(''),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;
