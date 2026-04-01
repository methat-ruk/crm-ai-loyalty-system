import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { GenerateCustomerInsightDto } from './dto/generate-insight.dto.js';

@Injectable()
export class AiService {
  private openai: OpenAI | null = null;
  private provider: string;
  private model: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.provider = this.config.get<string>('AI_PROVIDER') ?? 'mock';
    const apiKey = this.config.get<string>('AI_API_KEY') ?? '';

    if (this.provider === 'openai') {
      this.model =
        this.config.get<string>('AI_MODEL') ?? 'gpt-4o-mini';
      this.openai = new OpenAI({ apiKey });
    } else if (this.provider === 'groq') {
      this.model =
        this.config.get<string>('AI_MODEL') ?? 'llama-3.1-8b-instant';
      this.openai = new OpenAI({
        apiKey,
        baseURL: 'https://api.groq.com/openai/v1',
      });
    }
  }

  private async callAI(prompt: string): Promise<string> {
    if (this.provider === 'mock' || !this.openai) {
      return this.getMockResponse(prompt);
    }

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content:
            'You are an AI assistant for a CRM loyalty system. Analyze customer data and provide concise, actionable insights in Thai language. Keep responses under 200 words.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content ?? 'ไม่สามารถสร้าง insight ได้';
  }

  private getMockResponse(prompt: string): string {
    if (prompt.includes('churn') || prompt.includes('ลูกค้า')) {
      return (
        '**สรุปพฤติกรรมลูกค้า**\n\n' +
        'ลูกค้ารายนี้มีกิจกรรมสม่ำเสมอในช่วง 3 เดือนที่ผ่านมา มีการสะสมคะแนนอย่างต่อเนื่องและแลกรางวัลเป็นประจำ ซึ่งแสดงถึงความภักดีต่อแบรนด์ในระดับดี\n\n' +
        '**ความเสี่ยง Churn: ต่ำ** 🟢\n\n' +
        'ลูกค้ามีแนวโน้มที่จะยังคงใช้งานต่อไป แนะนำให้ส่ง reward พิเศษในวันเกิดหรือช่วงเทศกาล เพื่อกระตุ้นการมีส่วนร่วมให้มากขึ้น'
      );
    }
    return (
      '**คำแนะนำแคมเปญโปรโมชั่น**\n\n' +
      'จากข้อมูลภาพรวมระบบ พบว่าลูกค้าในระดับ Bronze มีสัดส่วนสูงสุด แนะนำให้เปิดตัวแคมเปญ **Double Points Weekend** เพื่อกระตุ้นให้ลูกค้า Bronze สะสมคะแนนและยกระดับขึ้นเป็น Silver\n\n' +
      'นอกจากนี้ควรพิจารณา **Exclusive Reward สำหรับ Platinum** เพื่อรักษาฐานลูกค้า VIP ไว้ เนื่องจากกลุ่มนี้มี lifetime value สูงที่สุด'
    );
  }

  async generateCustomerInsight(dto: GenerateCustomerInsightDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
      include: {
        loyaltyAccount: {
          include: {
            transactions: {
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
          },
        },
        redemptions: {
          include: { reward: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!customer) throw new NotFoundException('Customer not found');

    const totalPoints = customer.loyaltyAccount?.totalPoints ?? 0;
    const lifetimePoints = customer.loyaltyAccount?.lifetimePoints ?? 0;
    const recentTxCount = customer.loyaltyAccount?.transactions.length ?? 0;
    const redemptionCount = customer.redemptions.length;
    const rewardNames = customer.redemptions
      .map((r) => r.reward.name)
      .join(', ');

    const prompt =
      `วิเคราะห์ข้อมูลลูกค้าต่อไปนี้และประเมินความเสี่ยง churn:\n` +
      `ชื่อ: ${customer.firstName} ${customer.lastName}\n` +
      `ระดับ: ${customer.tier}\n` +
      `คะแนนปัจจุบัน: ${totalPoints} คะแนน\n` +
      `คะแนนสะสมตลอดชีพ: ${lifetimePoints} คะแนน\n` +
      `ธุรกรรมล่าสุด 10 รายการ: ${recentTxCount} รายการ\n` +
      `การแลกรางวัล: ${redemptionCount} ครั้ง (${rewardNames || 'ยังไม่เคยแลก'})\n` +
      `สถานะบัญชี: ${customer.isActive ? 'ใช้งานอยู่' : 'ปิดใช้งาน'}\n\n` +
      `สรุปพฤติกรรมและระบุความเสี่ยง churn (ต่ำ/ปานกลาง/สูง) พร้อมคำแนะนำ`;

    const content = await this.callAI(prompt);

    const insight = await this.prisma.aIInsight.create({
      data: {
        customerId: customer.id,
        type: 'CHURN_RISK',
        content,
        metadata: {
          tier: customer.tier,
          totalPoints,
          redemptionCount,
          provider: this.provider,
        },
      },
    });

    return {
      insight,
      customer: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        tier: customer.tier,
        totalPoints,
      },
    };
  }

  async generatePromoRecommendation() {
    const [campaigns, overview] = await Promise.all([
      this.prisma.campaign.findMany({
        where: { isActive: true },
        orderBy: { startDate: 'desc' },
        take: 5,
      }),
      this.prisma.customer.aggregate({
        _count: { id: true },
      }),
    ]);

    const tierCounts = await Promise.all(
      (['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'] as const).map((tier) =>
        this.prisma.customer.count({ where: { tier } }).then((count) => ({
          tier,
          count,
        })),
      ),
    );

    const campaignList = campaigns
      .map((c) => `- ${c.name} (${c.type})`)
      .join('\n');

    const tierSummary = tierCounts
      .map((t) => `${t.tier}: ${t.count} คน`)
      .join(', ');

    const prompt =
      `วิเคราะห์ข้อมูลและแนะนำแคมเปญโปรโมชั่นที่เหมาะสม:\n\n` +
      `จำนวนลูกค้าทั้งหมด: ${overview._count.id} คน\n` +
      `การกระจาย Tier: ${tierSummary}\n\n` +
      `แคมเปญที่ใช้งานอยู่:\n${campaignList || 'ยังไม่มีแคมเปญ'}\n\n` +
      `แนะนำกลยุทธ์แคมเปญใหม่ที่เหมาะสมกับโครงสร้างลูกค้า`;

    const content = await this.callAI(prompt);

    const insight = await this.prisma.aIInsight.create({
      data: {
        type: 'PROMOTION_RECOMMENDATION',
        content,
        metadata: {
          activeCampaigns: campaigns.length,
          totalCustomers: overview._count.id,
          provider: this.provider,
        },
      },
    });

    return { insight };
  }

  async getInsights(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.aIInsight.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          customer: {
            select: { id: true, firstName: true, lastName: true, tier: true },
          },
        },
      }),
      this.prisma.aIInsight.count(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  getProvider() {
    return { provider: this.provider, model: this.model || 'mock' };
  }
}
