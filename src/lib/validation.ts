import { z } from "zod";

export const slugSchema = z
  .string()
  .min(2)
  .max(60)
  .regex(/^[a-z0-9-]+$/, "슬러그는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.");

export const createCampaignSchema = z
  .object({
    slug: slugSchema,
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    imageUrl: z.string().url().optional(),
    unitPrice: z.number().int().positive(),
    regularPrice: z.number().int().positive().optional(),
    targetCount: z.number().int().positive().default(100),
    deadlineAt: z.string().datetime({ offset: true }).or(z.string().min(1)),
  })
  .refine((data) => !data.regularPrice || data.regularPrice > data.unitPrice, {
    message: "정가는 공동구매 확정가보다 높아야 합니다.",
    path: ["regularPrice"],
  });

const koreanMobileRegex = /^01[016789]\d{7,8}$/;

export function normalizePhoneNumber(raw: string): string {
  const digitsOnly = raw.replace(/\D/g, "");
  if (!koreanMobileRegex.test(digitsOnly)) {
    throw new Error("올바른 휴대폰 번호 형식이 아닙니다.");
  }
  return digitsOnly;
}

export const sendOtpSchema = z.object({
  campaignId: z.string().uuid(),
  phoneNumber: z.string().min(9).max(15),
});

export const verifyOtpSchema = z.object({
  campaignId: z.string().uuid(),
  phoneNumber: z.string().min(9).max(15),
  code: z.string().length(6),
});

export const billingIssueSchema = z.object({
  campaignId: z.string().uuid(),
  phoneNumber: z.string().min(9).max(15),
  authKey: z.string().min(1),
  customerKey: z.string().min(1),
  verificationToken: z.string().min(1),
});
