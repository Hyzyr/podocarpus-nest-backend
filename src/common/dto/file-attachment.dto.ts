import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { z } from 'zod';

/**
 * Reusable DTO for file attachments with metadata
 */
export class FileAttachmentDto {
  @ApiProperty({ example: 'document.pdf', description: 'Display name of the file' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'https://example.com/files/document.pdf', description: 'URL to the file' })
  @IsString()
  url: string;

  @ApiProperty({ example: 2.5, description: 'Size in MB' })
  @IsNumber()
  @Type(() => Number)
  sizeMb: number;

  @ApiPropertyOptional({ example: false, description: 'Visibility flag' })
  @IsOptional()
  @IsBoolean()
  isPro?: boolean;

  @ApiPropertyOptional({ example: 'application/pdf', description: 'MIME type of the file' })
  @IsOptional()
  @IsString()
  mimeType?: string;
}

/**
 * Reusable Zod schema for file attachments
 */
export const FileAttachmentSchema = z.object({
  name: z.string(),
  url: z.string(),
  sizeMb: z.number(),
  isPro: z.boolean().optional(),
  mimeType: z.string().optional(),
});
