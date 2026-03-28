import { Test, TestingModule } from '@nestjs/testing';
import { LoyaltyController } from './loyalty.controller.js';

describe('LoyaltyController', () => {
  let controller: LoyaltyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoyaltyController],
    }).compile();

    controller = module.get<LoyaltyController>(LoyaltyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
