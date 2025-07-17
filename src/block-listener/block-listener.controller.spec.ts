import { Test, TestingModule } from '@nestjs/testing';
import { BlockListenerController } from './block-listener.controller';

describe('BlockListenerController', () => {
  let controller: BlockListenerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlockListenerController],
    }).compile();

    controller = module.get<BlockListenerController>(BlockListenerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
