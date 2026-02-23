import { Test, TestingModule } from '@nestjs/testing';
import { CasaImagenesController } from './casa_imagenes.controller';

describe('CasaImagenesController', () => {
  let controller: CasaImagenesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CasaImagenesController],
    }).compile();

    controller = module.get<CasaImagenesController>(CasaImagenesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
