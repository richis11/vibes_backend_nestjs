import { Test, TestingModule } from '@nestjs/testing';
import { CasasController } from './casas.controller';

describe('CasasController', () => {
  let controller: CasasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CasasController],
    }).compile();

    controller = module.get<CasasController>(CasasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
