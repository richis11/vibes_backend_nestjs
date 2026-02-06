import { Test, TestingModule } from '@nestjs/testing';
import { CasasService } from './casas.service';

describe('CasasService', () => {
  let service: CasasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CasasService],
    }).compile();

    service = module.get<CasasService>(CasasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
