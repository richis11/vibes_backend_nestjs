import { Test, TestingModule } from '@nestjs/testing';
import { CasaImagenesService } from './casa_imagenes.service';

describe('CasaImagenesService', () => {
  let service: CasaImagenesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CasaImagenesService],
    }).compile();

    service = module.get<CasaImagenesService>(CasaImagenesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
