import { ApiProperty } from '@nestjs/swagger';

export type CommonResponseType = {
  status: 'success' | 'error';
  message: string;
};

export class CommonResponse {
  @ApiProperty({ type: String, example: 'success' })
  status: boolean;

  @ApiProperty({ type: String, example: 'Saved successfully' })
  message: boolean;
}
